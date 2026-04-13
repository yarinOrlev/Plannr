import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const ProductContext = createContext();

// Initial dummy data for the application (will be used as fallback/seed)
const defaultData = {
  products: [],
  activeProductId: '',
  selectedProductIds: [],
  strategy: [],
  features: [],
  kpis: [],
  roadmaps: [],
  objectives: [],
  documentation: [], // Documentation is mostly static/reference in this app
  notes: [],
  customers: [],
  productUsers: [],
  roadmapBoards: [],
  activeRoadmapBoardId: '',
  availableTeams: ['Bifrost', 'Picasso', 'Olympus', 'DWH', 'Cloud', 'Everest', 'Maavarim', '43', 'Genesis', 'Opal', 'Infra', 'Cyber'],
  reviews: [],
  teams: [],
  teamMembers: [],
  scoringConfig: [
    { id: 'reach', label: 'טווח (Reach)', weight: 1, type: 'multiplier', defaultValue: 1, info: 'כמה משתמשים יושפעו?' },
    { id: 'impact', label: 'השפעה (Impact)', weight: 1, type: 'multiplier', defaultValue: 1, info: 'כמה זה יתרום למטרה?' },
    { id: 'confidence', label: 'ביטחון (Confidence)', weight: 1, type: 'multiplier', defaultValue: 1, info: 'כמה אנחנו בטוחים?' },
    { id: 'effort', label: 'מאמץ (Effort)', weight: 1, type: 'divider', defaultValue: 1, info: 'כמה זמן זה ייקח?' }
  ]
};

export const ProductProvider = ({ children }) => {
  const { user, isAuthenticated, isHoD } = useAuth();
  const [data, setData] = useState(() => {
    const savedBoards = localStorage.getItem('plannr_roadmap_boards');
    const savedScoring = localStorage.getItem('plannr_scoring_config');
    return {
      ...defaultData,
      roadmapBoards: savedBoards ? JSON.parse(savedBoards) : [],
      scoringConfig: savedScoring ? JSON.parse(savedScoring) : defaultData.scoringConfig
    };
  });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const isFetching = useRef(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('plannr_dark_mode') === 'true');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('plannr_dark_mode', darkMode);
  }, [darkMode]);

  // Fetch all data from Supabase on login
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAllData();
    } else if (!isAuthenticated) {
      setData(defaultData);
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    logger.info('Initializing real-time subscriptions...');
    
    // Create a single channel for all public schema changes
    const channel = supabase
      .channel('plannr-app-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          const { table, eventType, new: newRecord, old: oldRecord } = payload;
          
          setData(prev => {
            const tableKeyMap = {
              products: 'products',
              features: 'features',
              roadmaps: 'roadmaps',
              roadmap_boards: 'roadmapBoards',
              strategy: 'strategy',
              objectives: 'objectives',
              notes: 'notes',
              reviews: 'reviews',
              customers: 'customers',
              documentation: 'documentation',
              teams: 'teams',
              team_members: 'teamMembers'
            };

            const key = tableKeyMap[table];
            if (!key) return prev;

            let updatedList = [...(prev[key] || [])];

            if (eventType === 'INSERT') {
              // Avoid duplicates if we already have it (e.g. from local optimistic update)
              if (!updatedList.some(item => item.id === newRecord.id)) {
                updatedList = (table === 'notes' || table === 'reviews') 
                  ? [newRecord, ...updatedList] 
                  : [...updatedList, newRecord];
                logger.info(`Real-time INSERT: ${table}`, { newRecord });
              }
            } else if (eventType === 'UPDATE') {
              updatedList = updatedList.map(item => item.id === newRecord.id ? { ...item, ...newRecord } : item);
              logger.info(`Real-time UPDATE: ${table}`, { id: newRecord.id });
            } else if (eventType === 'DELETE') {
              updatedList = updatedList.filter(item => item.id !== oldRecord.id);
              logger.info(`Real-time DELETE: ${table}`, { id: oldRecord.id });
            }

            return { ...prev, [key]: updatedList };
          });
        }
      )
      .subscribe((status) => {
        logger.info(`Real-time subscription status: ${status}`);
      });

    return () => {
      logger.info('Cleaning up real-time subscriptions...');
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id]);

  const fetchAllData = async () => {
    if (!user) {
      logger.info('fetchAllData: No user available yet, skipping fetch');
      setLoading(false);
      return;
    }
    
    if (isFetching.current) {
      logger.info('fetchAllData: Fetch already in progress, skipping and ensuring loading is true');
      // If we are already fetching, we don't want to set loading to false yet, 
      // but we also don't want to start a new one. 
      // The first one will call setLoading(false) when done.
      return;
    }
    
    isFetching.current = true;
    setLoading(true);
    setFetchError(null);
    logger.info('Fetching compartmentalized data from Supabase...', { userId: user.id, isHoD });
    
    try {
      let products = [];
      let teams = [];
      let teamMembers = [];

      if (isHoD) {
        logger.info('HoD Path: Fetching all teams, members, and products');
        const [tRes, tmRes, pRes] = await Promise.all([
          supabase.from('teams').select('*').order('name'),
          supabase.from('team_members').select('*'),
          supabase.from('products').select('*').order('created_at', { ascending: true })
        ]);
        
        teams = tRes.data || [];
        teamMembers = tmRes.data || [];
        products = pRes.data || [];
      } else {
        logger.info('Standard Path: Fetching user-specific teams and products');
        // 1. Fetch teams I belong to
        const { data: myMemberships } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
        const teamIds = (myMemberships || []).map(m => m.team_id);
        
        // Also include teams I own
        const { data: ownedTeams } = await supabase.from('teams').select('id').eq('owner_id', user.id);
        const ownedTeamIds = (ownedTeams || []).map(t => t.id);
        
        const allMyTeamIds = [...new Set([...teamIds, ...ownedTeamIds])];
        logger.info('User teams identified', { count: allMyTeamIds.length });

        if (allMyTeamIds.length > 0) {
          const [mtRes, mRes, tpRes] = await Promise.all([
            supabase.from('teams').select('*').in('id', allMyTeamIds).order('name'),
            supabase.from('team_members').select('*').in('team_id', allMyTeamIds),
            supabase.from('products').select('*').in('team_id', allMyTeamIds).order('created_at', { ascending: true })
          ]);
          
          teams = mtRes.data || [];
          teamMembers = mRes.data || [];
          products = tpRes.data || [];
        }

        // 2. Fetch products owned directly
        const { data: ownedDirectly } = await supabase.from('products').select('*').eq('owner_id', user.id).is('team_id', null);
        if (ownedDirectly && ownedDirectly.length > 0) {
          products = [...products, ...ownedDirectly];
        }
      }

      const allowedProductIds = products.map(p => p.id);
      logger.info('Allowed products identified', { count: allowedProductIds.length });

      // 2. Fetch all other data
      const getQuery = (table) => {
        let q = supabase.from(table).select('*');
        if (isHoD) return q;

        if (allowedProductIds.length > 0) {
          const idsString = allowedProductIds.join(',');
          return q.or(`product_id.in.(${idsString}),product_id.is.null`);
        } else {
          return q.is('product_id', null);
        }
      };

      const fetchTable = async (table, query) => {
        try {
          logger.info(`Fetching table: ${table}...`);
          const { data, error } = await query;
          if (error) {
            logger.error(`Error fetching ${table}:`, error);
            return [];
          }
          return data || [];
        } catch (e) {
          logger.error(`Crash fetching ${table}:`, e);
          return [];
        }
      };

      logger.info('Initiating parallel secondary data fetches...');
      const [
        features, strategy, roadmaps, objectives, notes, 
        reviews, roadmapBoards, customers, productUsers, documentation
      ] = await Promise.all([
        fetchTable('features', getQuery('features')),
        fetchTable('strategy', getQuery('strategy')),
        fetchTable('roadmaps', getQuery('roadmaps')),
        fetchTable('objectives', getQuery('objectives')),
        fetchTable('notes', getQuery('notes').order('created_at', { ascending: false })),
        fetchTable('reviews', getQuery('reviews')),
        fetchTable('roadmap_boards', getQuery('roadmap_boards')),
        fetchTable('customers', getQuery('customers')),
        fetchTable('product_users', getQuery('product_users')),
        fetchTable('documentation', getQuery('documentation'))
      ]);

      setData(prev => {
        const nextActiveProductId = products?.[0]?.id || prev.activeProductId;
        const nextActiveBoardId = (roadmapBoards || []).find(b => b.product_id === nextActiveProductId)?.id || '';
        
        return {
          ...prev,
          products: products || [],
          teams: teams || [],
          teamMembers: teamMembers || [],
          features,
          strategy,
          roadmaps,
          objectives,
          notes,
          reviews,
          roadmapBoards,
          customers,
          productUsers,
          documentation: documentation || [],
          activeProductId: nextActiveProductId,
          selectedProductIds: products.map(p => p.id),
          activeRoadmapBoardId: nextActiveBoardId
        };
      });
      logger.info('Data fetch successful and state updated', { productsCount: products?.length });

    } catch (error) {
      logger.error('Critical error in fetchAllData:', error);
      setFetchError(error.message || 'שגיאת תקשורת עם בסיס הנתונים');
    } finally {
      logger.info('fetchAllData finished, clearing loading state');
      setLoading(false);
      isFetching.current = false;
    }
  };

  const seedInitialData = async (silent = false) => {
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setFetchError(null);
    try {
      const demoProductId = `prod_demo_${Date.now()}`;
      const demoProduct = { 
        id: demoProductId, 
        name: 'מוצר דמו אסטרטגי', 
        description: 'מוצר לצרכי בדיקה והדגמה.',
        owner_id: user.id
      };

      const { error: pErr } = await supabase.from('products').insert([demoProduct]);
      if (pErr) throw pErr;

      const demoFeatures = [
        { id: `feat_demo_1_${Date.now()}`, product_id: demoProductId, title: 'חיפוש מהיר', reach: 10, impact: 8, confidence: 9, effort: 3, status: 'Done' },
        { id: `feat_demo_2_${Date.now()}`, product_id: demoProductId, title: 'לוח בקרה אישי', reach: 7, impact: 10, confidence: 10, effort: 8, status: 'Planned' }
      ];
      const { error: fErr } = await supabase.from('features').insert(demoFeatures);
      if (fErr) throw fErr;

      const demoStrategy = [
        { id: `strat_demo_1_${Date.now()}`, product_id: demoProductId, type: 'Problem', title: 'חוסר יעילות', description: 'משתמשים מבזבזים זמן על פעולות ידניות.' },
        { id: `strat_demo_2_${Date.now()}`, product_id: demoProductId, type: 'Product', title: 'אוטומציה חכמה', description: 'מנוע אוטומיזציה שמקצר תהליכים ב-50%.' }
      ];
      const { error: sErr } = await supabase.from('strategy').insert(demoStrategy);
      if (sErr) throw sErr;

      await fetchAllData();
      logger.info('Demo data seeded successfully');
      if (!silent) alert('נתוני דמו נטענו בהצלחה!');
    } catch (err) {
      console.error('Error seeding data:', err);
      if (!silent) alert('שגיאה בטעינת נתונים: ' + err.message);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const setActiveProduct = (id) => {
    setData(prev => {
      const activeBoards = (prev.roadmapBoards || []).filter(b => b.product_id === id);
      const newBoardId = activeBoards[0]?.id || '';
      return { ...prev, activeProductId: id, activeRoadmapBoardId: newBoardId };
    });
  };

  const addProduct = async (product) => {
    try {
      console.log('ProductContext: addProduct called', { product });
      // Find the user's primary team to associate this product with
      const myOwnedTeams = data.teams.filter(t => t.owner_id === user.id);
      const teamId = myOwnedTeams[0]?.id || null;

      const newProduct = { 
        id: product.id || `prod_${Date.now()}`, 
        name: product.name, 
        description: product.description,
        owner_id: user.id,
        team_id: teamId
      };
      const { data: newProd, error } = await supabase.from('products').insert([newProduct]).select();
      if (error) {
        console.error('Supabase error in addProduct:', error);
        throw error;
      }
      if (!newProd || newProd.length === 0) throw new Error('No data returned from product insert');

      const defaultBoard = {
        id: `board_${Date.now()}_default`,
        product_id: newProd[0].id,
        name: 'מפת דרכים ראשית',
        view_type: 'kanban',
        columns: [
          { key: 'Now', label: 'עכשיו', color: 'blue', icon: 'Zap' },
          { key: 'Next', label: 'הבא', color: 'purple', icon: 'ArrowRight' },
          { key: 'Later', label: 'בעתיד', color: 'yellow', icon: 'Clock' }
        ]
      };

      const { error: bErr } = await supabase.from('roadmap_boards').insert([defaultBoard]);
      if (bErr) {
        console.error('Supabase error saving default board:', bErr);
      }

      setData(prev => ({
        ...prev,
        products: [...prev.products, newProd[0]],
        roadmapBoards: [...(prev.roadmapBoards || []), defaultBoard],
        activeProductId: newProd[0].id,
        activeRoadmapBoardId: defaultBoard.id
      }));
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      console.log('ProductContext: deleteProduct called with thorough cleanup', { id });
      
      // 1. Delete all dependent data in Supabase (order matters for potential internal constraints)
      await Promise.all([
        supabase.from('roadmaps').delete().eq('product_id', id),
        supabase.from('roadmap_boards').delete().eq('product_id', id),
        supabase.from('features').delete().eq('product_id', id),
        supabase.from('strategy').delete().eq('product_id', id),
        supabase.from('objectives').delete().eq('product_id', id),
        supabase.from('notes').delete().eq('product_id', id),
        supabase.from('reviews').delete().eq('product_id', id),
        supabase.from('customers').delete().eq('product_id', id),
        supabase.from('product_users').delete().eq('product_id', id),
        supabase.from('product_shares').delete().eq('product_id', id)
      ]);

      // 2. Finally delete the product itself
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      // 3. Update local state for ALL tables to keep UI consistent
      setData(prev => {
        const nextProducts = (prev.products || []).filter(p => p.id !== id);
        return {
          ...prev,
          products: nextProducts,
          roadmaps: (prev.roadmaps || []).filter(r => r.product_id !== id),
          roadmapBoards: (prev.roadmapBoards || []).filter(b => b.product_id !== id),
          features: (prev.features || []).filter(f => f.product_id !== id),
          strategy: (prev.strategy || []).filter(s => s.product_id !== id),
          objectives: (prev.objectives || []).filter(o => o.product_id !== id),
          notes: (prev.notes || []).filter(n => n.product_id !== id),
          reviews: (prev.reviews || []).filter(rv => rv.product_id !== id),
          customers: (prev.customers || []).filter(c => c.product_id !== id),
          productUsers: (prev.productUsers || []).filter(u => u.product_id !== id),
          activeProductId: prev.activeProductId === id ? (nextProducts[0]?.id || '') : prev.activeProductId
        };
      });
      
      logger.info('Product and all its data deleted successfully', { productId: id });
    } catch (err) {
      console.error('Error deleting product and its dependencies:', err);
      alert('שגיאה במחיקת המוצר: ' + err.message);
    }
  };

  const addFeature = async (productFeature) => {
    try {
      console.log('ProductContext: addFeature called', { productFeature });
      const { productIds, ...rest } = productFeature;
      
      const featuresToInsert = (productIds || [data.activeProductId]).map(pid => ({
        ...rest,
        id: `feat_${Date.now()}_${pid}`, // Unique ID per product copy
        product_id: pid,
        group_id: productFeature.id || `group_${Date.now()}` // Shared identifier for future linking
      }));

      // Since we don't have product_ids column, we'll insert multiple rows if needed,
      // but only if the user specifically asked for 'each product... i want to add'.
      // If we only have product_id column, we'll just insert multiple rows.
      // NOTE: Remove columns that don't exist in the schema cache to avoid errors.
      const sanitized = featuresToInsert.map(({ product_ids, productIds, group_id, totalScore, ...f }) => f);

      const { data: inserted, error } = await supabase.from('features').insert(sanitized).select();
      if (error) {
        console.error('Supabase error in addFeature:', error);
        throw error;
      }
      setData(prev => ({ ...prev, features: [...prev.features, ...inserted] }));
    } catch (err) {
      console.error('Error adding feature:', err);
    }
  };

  const updateScoringConfig = (config) => {
    setData(prev => ({ ...prev, scoringConfig: config }));
    localStorage.setItem('plannr_scoring_config', JSON.stringify(config));
  };

  const updateFeature = async (id, updates) => {
    try {
      const { product_ids, productIds, group_id, totalScore, ...sanitized } = updates;
      
      // If productIds is provided, we use the first one as the primary product_id for this record
      if (productIds && productIds.length > 0) {
        sanitized.product_id = productIds[0];
      }

      const { error } = await supabase.from('features').update(sanitized).eq('id', id);
      if (error) throw error;
      
      setData(prev => ({
        ...prev,
        features: prev.features.map(f => f.id === id ? { ...f, ...updates, product_id: sanitized.product_id || f.product_id } : f)
      }));
    } catch (err) {
      console.error('Error updating feature:', err);
    }
  };

  const deleteFeature = async (id) => {
    try {
      const { error } = await supabase.from('features').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        features: prev.features.filter(f => f.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting feature:', err);
    }
  };

  const addObjective = async (objective) => {
    try {
      console.log('ProductContext: addObjective called', { objective });
      logger.info('Adding objective to Supabase...', { title: objective.title });
      const { keyResults, ...rest } = objective;
      const newObj = { 
        ...rest, 
        id: objective.id || `obj_${Date.now()}`,
        key_results: keyResults 
      };
      
      console.log('ProductContext: payload for objectives', newObj);
      const { data: inserted, error } = await supabase.from('objectives').insert([newObj]).select();
      if (error) {
        console.error('Supabase error in addObjective:', error);
        throw error;
      }
      if (!inserted || inserted.length === 0) throw new Error('No data returned from objective insert');
      
      setData(prev => ({ ...prev, objectives: [...prev.objectives, inserted[0]] }));
      logger.info('Objective added successfully');
    } catch (err) {
      logger.error('Error adding objective:', err);
    }
  };

  const updateObjective = async (id, updates) => {
    try {
      console.log('ProductContext: updateObjective called', { id, updates });
      const { keyResults, ...rest } = updates;
      const payload = { ...rest };
      if (keyResults) payload.key_results = keyResults;

      const { error } = await supabase.from('objectives').update(payload).eq('id', id);
      if (error) throw error;
      
      setData(prev => ({
        ...prev,
        objectives: prev.objectives.map(o => o.id === id ? { ...o, ...updates, key_results: keyResults || o.key_results } : o)
      }));
    } catch (err) {
      console.error('Error updating objective:', err);
    }
  };

  const deleteObjective = async (id) => {
    try {
      console.log('ProductContext: deleteObjective called', { id });
      const { error } = await supabase.from('objectives').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({ ...prev, objectives: prev.objectives.filter(o => o.id !== id) }));
    } catch (err) {
      console.error('Error deleting objective:', err);
    }
  };

  const updateStrategy = async (type, title, description, productId) => {
    try {
      const targetId = productId || data.activeProductId;
      const existing = data.strategy.find(s => s.product_id === targetId && s.type === type);
      if (existing) {
        const { error } = await supabase.from('strategy').update({ title, description }).eq('id', existing.id);
        if (error) throw error;
        setData(prev => ({
          ...prev,
          strategy: prev.strategy.map(s => s.id === existing.id ? { ...s, title, description } : s)
        }));
      } else {
        const newStrat = { 
          id: `strat_${Date.now()}`,
          product_id: targetId, 
          type, 
          title, 
          description 
        };
        const { data: inserted, error } = await supabase.from('strategy').insert([newStrat]).select();
        if (error) throw error;
        setData(prev => ({ ...prev, strategy: [...prev.strategy, inserted[0]] }));
      }
    } catch (err) {
      console.error('Error updating strategy:', err);
    }
  };

  const addDoc = async (doc) => {
    try {
      console.log('ProductContext: addDoc called', { doc });
      const newDoc = { 
        ...doc, 
        id: doc.id || `doc_${Date.now()}`, 
        product_id: doc.product_id || data.activeProductId, 
        updated_at: new Date().toISOString().split('T')[0],
        category: doc.category || 'General'
      };
      
      const { data: inserted, error } = await supabase.from('documentation').insert([newDoc]).select();
      if (error) {
        console.error('Supabase error in addDoc:', error);
        throw error;
      }
      
      setData(prev => ({ ...prev, documentation: [...(prev.documentation || []), inserted[0]] }));
      return { success: true, data: inserted[0] };
    } catch (err) {
      console.error('Error adding doc:', err);
      return { success: false, error: err.message };
    }
  };

  const updateDoc = async (id, updates) => {
    try {
      console.log('ProductContext: updateDoc called', { id, updates });
      const payload = { ...updates, updated_at: new Date().toISOString().split('T')[0] };
      const { error } = await supabase.from('documentation').update(payload).eq('id', id);
      if (error) {
        console.error('Supabase error in updateDoc:', error);
        throw error;
      }
      
      setData(prev => ({
        ...prev,
        documentation: (prev.documentation || []).map(d => d.id === id ? { ...d, ...updates, updated_at: payload.updated_at } : d)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error updating doc:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteDoc = async (id) => {
    try {
      const { error } = await supabase.from('documentation').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({ ...prev, documentation: (prev.documentation || []).filter(d => d.id !== id) }));
    } catch (err) {
      console.error('Error deleting doc:', err);
    }
  };

  const addRoadmapItem = async (item) => {
    try {
      console.log('ProductContext: addRoadmapItem called', { item });
      const targetProductId = item.product_id || data.activeProductId;
      
      // Find a board for the target product
      const targetProductBoards = (data.roadmapBoards || []).filter(b => b.product_id === targetProductId);
      
      // Try to find a board with the same quarter/year as the current active board
      const currentBoard = (data.roadmapBoards || []).find(b => b.id === data.activeRoadmapBoardId);
      let targetBoard = null;
      
      if (currentBoard) {
        targetBoard = targetProductBoards.find(b => b.quarter === currentBoard.quarter && b.year === currentBoard.year);
      }
      
      // Fallback to the first board for that product or an empty string
      const boardId = item.board_id || item.boardId || targetBoard?.id || targetProductBoards[0]?.id || '';

      const newItem = { 
        id: item.id || `rm_${Date.now()}`,
        product_id: targetProductId, 
        board_id: boardId,
        title: item.title,
        bucket: item.bucket,
        description: item.description,
        quarter: item.quarter,
        year: item.year,
        start_month: Math.round(item.startMonth || 0),
        duration: Math.max(1, Math.round(item.duration || 1)),
        teams: item.teams || []
      };
      console.log('ProductContext: payload for roadmaps', newItem);
      
      const { data: inserted, error } = await supabase.from('roadmaps').insert([newItem]).select();
      if (error) {
        console.error('Supabase error in addRoadmapItem:', error);
        throw error;
      }
      if (!inserted || inserted.length === 0) throw new Error('No data returned from roadmap insert');

      setData(prev => ({
        ...prev,
        roadmaps: [...prev.roadmaps, inserted[0]]
      }));
    } catch (err) {
      console.error('Error adding roadmap item:', err);
    }
  };

  const updateRoadmapItem = async (id, updates) => {
    try {
      const validCols = ['id', 'product_id', 'board_id', 'title', 'bucket', 'description', 'quarter', 'year', 'start_month', 'duration', 'teams'];
      const filteredUpdates = {};
      
      Object.keys(updates).forEach(key => {
        let dbKey = key;
        if (dbKey === 'startMonth') dbKey = 'start_month';
        
        if (validCols.includes(dbKey)) {
          let val = updates[key];
          if (dbKey === 'start_month' || dbKey === 'duration') {
            val = Math.round(Number(val) || 0);
            if (dbKey === 'duration') val = Math.max(1, val);
          }
          filteredUpdates[dbKey] = val;
        }
      });

      console.log('ProductContext: updateRoadmapItem filtered', filteredUpdates);
      const { error } = await supabase.from('roadmaps').update(filteredUpdates).eq('id', id);
      if (error) throw error;
      
      setData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.map(rm => rm.id === id ? { ...rm, ...updates } : rm)
      }));
    } catch (err) {
      console.error('Error updating roadmap item:', err);
    }
  };

  const deleteRoadmapItem = async (id) => {
    try {
      const { error } = await supabase.from('roadmaps').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        roadmaps: prev.roadmaps.filter(rm => rm.id !== id)
      }));
    } catch (err) {
      console.error('Error deleting roadmap item:', err);
    }
  };

  const addRoadmapBoard = async (board) => {
    try {
      console.log('ProductContext: addRoadmapBoard called', { board });
      
      // Enforce "One Timeline per Team" per timeframe
      if (board.view_type === 'timeline') {
        const existing = (data.roadmapBoards || []).find(b => b.view_type === 'timeline' && b.quarter === board.quarter && b.year === board.year);
        if (existing) {
          console.warn('Roadmap board for this timeframe already exists. Reusing existing board.');
          return;
        }
      }

      const newBoard = { 
        id: `board_${Date.now()}`,
        // Timeline boards are team-wide (null product_id). Kanban boards are per-product.
        product_id: board.product_id !== undefined ? board.product_id : (board.view_type === 'timeline' ? null : data.activeProductId),
        name: board.name,
        view_type: board.view_type || 'kanban',
        columns: board.columns || [
          { key: 'Now', label: 'עכשיו', color: 'blue', icon: 'Zap' },
          { key: 'Next', label: 'הבא', color: 'purple', icon: 'ArrowRight' },
          { key: 'Later', label: 'בעתיד', color: 'yellow', icon: 'Clock' }
        ],
        quarter: board.quarter,
        year: board.year
      };
      
      const { data: inserted, error } = await supabase.from('roadmap_boards').insert([newBoard]).select();
      if (error) {
        console.error('Supabase error in addRoadmapBoard:', error);
        throw error;
      }
      if (!inserted || inserted.length === 0) throw new Error('No data returned from board insert');

      setData(prev => ({
        ...prev,
        roadmapBoards: [...(prev.roadmapBoards || []), inserted[0]],
        activeRoadmapBoardId: inserted[0].id
      }));
    } catch (err) {
      console.error('Error adding roadmap board:', err);
    }
  };

  const updateRoadmapBoard = async (id, updates) => {
    try {
      console.log('ProductContext: updateRoadmapBoard called', { id, updates });
      const { error } = await supabase.from('roadmap_boards').update(updates).eq('id', id);
      if (error) throw error;

      setData(prev => ({
        ...prev,
        roadmapBoards: (prev.roadmapBoards || []).map(b => b.id === id ? { ...b, ...updates } : b)
      }));
    } catch (err) {
      console.error('Error updating roadmap board:', err);
    }
  };


  const setSelectedProductIds = (ids) => {
    setData(prev => ({ ...prev, selectedProductIds: ids }));
  };

  const deleteRoadmapBoard = async (id) => {
    try {
      console.log('ProductContext: deleteRoadmapBoard called', { id });
      const { error } = await supabase.from('roadmap_boards').delete().eq('id', id);
      if (error) throw error;

      setData(prev => {
        const updatedBoards = (prev.roadmapBoards || []).filter(b => b.id !== id);
        return {
          ...prev,
          roadmapBoards: updatedBoards,
          activeRoadmapBoardId: prev.activeRoadmapBoardId === id ? (updatedBoards.find(b => b.product_id === prev.activeProductId)?.id || '') : prev.activeRoadmapBoardId
        };
      });
    } catch (err) {
      console.error('Error deleting roadmap board:', err);
    }
  };

  const setActiveRoadmapBoard = (id) => {
    setData(prev => ({ ...prev, activeRoadmapBoardId: id }));
  };

  const addNote = async (note) => {
    try {
      console.log('ProductContext: addNote called', { note });
      const now = new Date().toISOString();
      const newNote = {
        ...note,
        id: note.id || `note_${Date.now()}`,
        product_id: note.product_id || data.activeProductId,
        created_at: now
      };
      const { data: inserted, error } = await supabase.from('notes').insert([newNote]).select();
      if (error) {
        console.error('Supabase error in addNote:', error);
        throw error;
      }
      if (!inserted || inserted.length === 0) throw new Error('No data returned from insert');
      
      setData(prev => ({ ...prev, notes: [inserted[0], ...(prev.notes || [])] }));
      return { success: true, data: inserted[0] };
    } catch (err) {
      console.error('Error adding note:', err);
      return { success: false, error: err.message };
    }
  };

  const updateNote = async (id, updates) => {
    try {
      console.log('ProductContext: updateNote called', { id, updates });
      const { error } = await supabase.from('notes').update(updates).eq('id', id);
      if (error) {
        console.error('Supabase error in updateNote:', error);
        throw error;
      }
      
      setData(prev => ({
        ...prev,
        notes: (prev.notes || []).map(n => n.id === id ? { ...n, ...updates } : n)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error updating note:', err);
      return { success: false, error: err.message };
    }
  };

  const addAvailableTeam = (teamName) => {
    if (!teamName) return;
    setData(prev => ({
      ...prev,
      availableTeams: [...new Set([...(prev.availableTeams || []), teamName])]
    }));
  };

  const removeAvailableTeam = (teamName) => {
    setData(prev => ({
      ...prev,
      availableTeams: (prev.availableTeams || []).filter(t => t !== teamName)
    }));
  };

  const deleteNote = async (id) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const addCustomer = async (customer) => {
    try {
      console.log('ProductContext: addCustomer called', { customer });
      const newCustomer = {
        id: customer.id || `cust_${Date.now()}`,
        product_id: customer.product_id || data.activeProductId,
        name: customer.name,
        email: customer.email,
        company: customer.company,
        status: customer.status || 'Active',
        notes: customer.notes || [],
        description: customer.description || '',
        segment: customer.segment || 'Enterprise',
        wants: customer.wants || ''
      };
      
      const { data: inserted, error } = await supabase.from('customers').insert([newCustomer]).select();
      if (error) {
        console.error('Supabase error in addCustomer:', error);
        throw error;
      }
      if (!inserted || inserted.length === 0) throw new Error('No data returned from customer insert');

      setData(prev => ({
        ...prev,
        customers: [...(prev.customers || []), inserted[0]]
      }));
    } catch (err) {
      console.error('Error adding customer:', err);
    }
  };

  const addCustomerNote = async (customerId, noteText) => {
    try {
      console.log('ProductContext: addCustomerNote called', { customerId });
      const customer = data.customers.find(c => c.id === customerId);
      if (!customer) throw new Error('Customer not found');

      const newNote = { id: `cn_${Date.now()}`, text: noteText, createdAt: new Date().toISOString() };
      const updatedNotes = [...(customer.notes || []), newNote];

      const { error } = await supabase.from('customers').update({ notes: updatedNotes }).eq('id', customerId);
      if (error) {
        console.error('Supabase error in addCustomerNote:', error);
        throw error;
      }

      setData(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === customerId ? { ...c, notes: updatedNotes } : c)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error adding customer note:', err);
      return { success: false, error: err.message };
    }
  };

  const updateCustomer = async (id, updates) => {
    try {
      console.log('ProductContext: updateCustomer called', { id, updates });
      const { error } = await supabase.from('customers').update(updates).eq('id', id);
      if (error) throw error;

      setData(prev => ({
        ...prev,
        customers: (prev.customers || []).map(c => c.id === id ? { ...c, ...updates } : c)
      }));
    } catch (err) {
      console.error('Error updating customer:', err);
    }
  };

  const updateCustomerNote = async (customerId, noteId, newText) => {
    try {
      console.log('ProductContext: updateCustomerNote called', { customerId, noteId });
      const customer = data.customers.find(c => c.id === customerId);
      if (!customer) return;

      const updatedNotes = (customer.notes || []).map(n => 
        n.id === noteId ? { ...n, text: newText, updatedAt: new Date().toISOString() } : n
      );

      const { error } = await supabase.from('customers').update({ notes: updatedNotes }).eq('id', customerId);
      if (error) throw error;

      setData(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === customerId ? { ...c, notes: updatedNotes } : c)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error updating customer note:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteCustomerNote = async (customerId, noteId) => {
    try {
      console.log('ProductContext: deleteCustomerNote called', { customerId, noteId });
      const customer = data.customers.find(c => c.id === customerId);
      if (!customer) return;

      const updatedNotes = (customer.notes || []).filter(n => n.id !== noteId);

      const { error } = await supabase.from('customers').update({ notes: updatedNotes }).eq('id', customerId);
      if (error) throw error;

      setData(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === customerId ? { ...c, notes: updatedNotes } : c)
      }));
    } catch (err) {
      console.error('Error deleting customer note:', err);
    }
  };

  const deleteCustomer = async (id) => {
    try {
      console.log('ProductContext: deleteCustomer called', { id });
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({ ...prev, customers: (prev.customers || []).filter(c => c.id !== id) }));
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const addProductUser = async (user) => {
    try {
      const newUser = { ...user, id: user.id || `u_${Date.now()}` };
      const { data: inserted, error } = await supabase.from('product_users').insert([newUser]).select();
      if (error) throw error;
      setData(prev => ({ ...prev, productUsers: [...(prev.productUsers || []), inserted[0]] }));
    } catch (err) {
      console.error('Error adding product user:', err);
    }
  };

  const updateProductUser = async (id, updates) => {
    try {
      const { error } = await supabase.from('product_users').update(updates).eq('id', id);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        productUsers: prev.productUsers.map(u => u.id === id ? { ...u, ...updates } : u)
      }));
    } catch (err) {
      console.error('Error updating product user:', err);
    }
  };

  const deleteProductUser = async (id) => {
    try {
      const { error } = await supabase.from('product_users').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({ ...prev, productUsers: prev.productUsers.filter(u => u.id !== id) }));
    } catch (err) {
      console.error('Error deleting product user:', err);
    }
  };

  const addProductUserNote = async (userId, text) => {
    try {
      console.log('ProductContext: addProductUserNote called', { userId });
      const user = data.productUsers.find(u => u.id === userId);
      if (!user) throw new Error('User not found');

      const newNote = { id: Date.now(), text, createdAt: new Date().toISOString() };
      const updatedNotes = [...(user.notes || []), newNote];
      const { error } = await supabase.from('product_users').update({ notes: updatedNotes }).eq('id', userId);
      if (error) {
        console.error('Supabase error in addProductUserNote:', error);
        throw error;
      }
      setData(prev => ({
        ...prev,
        productUsers: prev.productUsers.map(u => u.id === userId ? { ...u, notes: updatedNotes } : u)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error adding user note:', err);
      return { success: false, error: err.message };
    }
  };

  const updateProductUserNote = async (userId, noteId, newText) => {
    try {
      const user = data.productUsers.find(u => u.id === userId);
      if (!user) return;

      const updatedNotes = (user.notes || []).map(n => 
        n.id === noteId ? { ...n, text: newText, updatedAt: new Date().toISOString() } : n
      );

      const { error } = await supabase.from('product_users').update({ notes: updatedNotes }).eq('id', userId);
      if (error) throw error;
      
      setData(prev => ({
        ...prev,
        productUsers: prev.productUsers.map(u => u.id === userId ? { ...u, notes: updatedNotes } : u)
      }));
      return { success: true };
    } catch (err) {
      console.error('Error updating user note:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteProductUserNote = async (userId, noteId) => {
    try {
      const user = data.productUsers.find(u => u.id === userId);
      const updatedNotes = (user.notes || []).filter(n => n.id !== noteId);
      const { error } = await supabase.from('product_users').update({ notes: updatedNotes }).eq('id', userId);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        productUsers: prev.productUsers.map(u => u.id === userId ? { ...u, notes: updatedNotes } : u)
      }));
    } catch (err) {
      console.error('Error deleting user note:', err);
    }
  };

  const addReview = async (product_id, content, item_id = null) => {
    try {
      console.log('ProductContext: addReview called', { product_id, content, item_id });
      const newReview = { 
        id: `rev_${Date.now()}`,
        product_id, 
        item_id, 
        content, 
        status: 'Pending' 
      };
      const { data: inserted, error } = await supabase.from('reviews').insert([newReview]).select();
      if (error) {
        console.error('Supabase error in addReview:', error);
        throw error;
      }
      setData(prev => ({
        ...prev,
        reviews: [...(prev.reviews || []), inserted[0]]
      }));
    } catch (err) {
      console.error('Error adding review:', err);
    }
  };

  const shareProduct = async (productId, userId) => {
    // This is now legacy, using team-based access. 
    // For compatibility, we can add them to the product's team.
    const product = data.products.find(p => p.id === productId);
    if (product?.team_id) {
      return await addTeamMember(product.team_id, userId);
    }
    return false;
  };

  const addTeamMember = async (teamId, userId) => {
    try {
      const { error } = await supabase.from('team_members').insert([{
        team_id: teamId,
        user_id: userId
      }]);
      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (err) {
      console.error('Error adding team member:', err);
      return false;
    }
  };

  const removeTeamMember = async (teamId, userId) => {
    try {
      const { error } = await supabase.from('team_members').delete().eq('team_id', teamId).eq('user_id', userId);
      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (err) {
      console.error('Error removing team member:', err);
      return false;
    }
  };

  const createTeam = async (name) => {
    try {
      const { data: newTeam, error } = await supabase.from('teams').insert([{
        name,
        owner_id: user.id
      }]).select();
      if (error) throw error;
      
      // Auto-add owner as member
      await supabase.from('team_members').insert([{
        team_id: newTeam[0].id,
        user_id: user.id
      }]);
      
      await fetchAllData();
      return newTeam[0];
    } catch (err) {
      console.error('Error creating team:', err);
      return null;
    }
  };


  const updateReviewStatus = async (reviewId, status) => {
    try {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', reviewId);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        reviews: (prev.reviews || []).map(r => r.id === reviewId ? { ...r, status } : r)
      }));
    } catch (err) {
      console.error('Error updating review status:', err);
    }
  };



  // Helper selectors
  const selectedProductIds = data.selectedProductIds || (data.activeProductId ? [data.activeProductId] : []);

  const activeProduct = data.products.find(p => p.id === data.activeProductId);
  const activeStrategy = data.strategy.filter(s => selectedProductIds.includes(s.product_id));
  const activeFeatures = data.features.filter(f => {
    const pids = f.product_ids || [f.product_id];
    return pids.some(id => selectedProductIds.includes(id));
  });
  const activeKpis = (data.kpis || []).filter(k => selectedProductIds.includes(k.product_id));
  const activeObjectives = data.objectives.filter(obj => selectedProductIds.includes(obj.product_id));
  const activeDocs = data.documentation.filter(doc => !doc.product_id || selectedProductIds.includes(doc.product_id));
  const activeNotes = (data.notes || []).filter(n => selectedProductIds.includes(n.product_id));
  const activeCustomers = (data.customers || []).filter(c => selectedProductIds.includes(c.product_id));
  const activeProductUsers = (data.productUsers || []).filter(u => selectedProductIds.includes(u.product_id));
  const activeReviews = (data.reviews || []).filter(r => selectedProductIds.includes(r.product_id));

  const allRoadmapBoards = data.roadmapBoards || [];
  const activeRoadmapBoards = allRoadmapBoards.filter(b =>
    // Include kanban boards for selected products AND all timeline boards (team-wide, null product_id)
    b.view_type === 'timeline' || selectedProductIds.includes(b.product_id)
  );

  // Robust fallback for activeRoadmapBoard — look across all boards
  const activeRoadmapBoard = allRoadmapBoards.find(b => b.id === data.activeRoadmapBoardId)
    || allRoadmapBoards[0]
    || { product_id: data.activeProductId, id: 'board_default', name: 'מפת דרכים', columns: [] };

  const activeRoadmaps = data.roadmaps.filter(rm =>
    selectedProductIds.includes(rm.product_id) &&
    (rm.board_id === activeRoadmapBoard.id || (!rm.board_id && activeRoadmapBoard.id === 'board_default'))
  );

  const contextValue = {
    data,
    setData,
    setActiveProduct,
    addProduct,
    addFeature,
    updateFeature,
    deleteFeature,
    updateScoringConfig,
    addObjective,
    updateObjective,
    deleteObjective,
    updateStrategy,
    addDoc,
    updateDoc,
    deleteDoc,
    addRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    addNote,
    deleteNote,
    addCustomer,
    updateCustomer,
    addCustomerNote,
    updateCustomerNote,
    deleteCustomerNote,
    deleteCustomer,
    addProductUser,
    updateProductUser,
    deleteProductUser,
    addProductUserNote,
    updateProductUserNote,
    deleteProductUserNote,
    addReview,
    updateReviewStatus,
    deleteProduct,
    addTeamMember,
    removeTeamMember,
    createTeam,
    teams: data.teams || [],
    teamMembers: data.teamMembers || [],
    selectedProductIds,
    setSelectedProductIds,
    activeProduct,
    activeStrategy,
    activeFeatures,
    activeKpis,
    activeRoadmaps,
    activeObjectives,
    activeDocs,
    activeNotes,
    activeCustomers,
    activeProductUsers,
    activeReviews,
    darkMode,
    loading,
    fetchError,
    searchTerm,
    setSearchTerm,
    toggleDarkMode: () => setDarkMode(!darkMode),
    addAvailableTeam,
    removeAvailableTeam,
    availableTeams: data.availableTeams || [],
    roadmapBoards: allRoadmapBoards,    // ALL boards: both timeline (team-wide) and kanban (per-product)
    activeRoadmapBoard,
    products: data.products,             // expose raw products array
    addRoadmapBoard,
    updateRoadmapBoard,
    deleteRoadmapBoard,
    setActiveRoadmapBoard,
    seedInitialData,
    resetData: () => {
      setData(defaultData);
    }
  };

  return (
    <ProductContext.Provider value={contextValue}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProductContext = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext must be used within a ProductProvider');
  }
  return context;
};
