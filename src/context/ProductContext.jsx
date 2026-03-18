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

  const fetchAllData = async () => {
    if (!user) {
      logger.info('fetchAllData: No user available yet, skipping fetch');
      setLoading(false);
      return;
    }
    if (isFetching.current) {
      logger.info('fetchAllData: Fetch already in progress, skipping');
      return;
    }
    
    isFetching.current = true;
    setLoading(true);
    setFetchError(null);
    logger.info('Fetching compartmentalized data from Supabase...', { userId: user.id });
    try {
      let products = [];
      let teams = [];
      let teamMembers = [];

      if (isHoD) {
        const { data: allTeams } = await supabase.from('teams').select('*').order('name');
        const { data: allMembers } = await supabase.from('team_members').select('*');
        const { data: allProducts } = await supabase.from('products').select('*').order('created_at', { ascending: true });
        
        teams = allTeams || [];
        teamMembers = allMembers || [];
        products = allProducts || [];
      } else {
        // 1. Fetch teams I belong to
        const { data: myMemberships } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
        const teamIds = (myMemberships || []).map(m => m.team_id);
        
        // Also include teams I own (in case I am not explicitly listed as a member yet)
        const { data: ownedTeams } = await supabase.from('teams').select('id').eq('owner_id', user.id);
        const ownedTeamIds = (ownedTeams || []).map(t => t.id);
        
        const allMyTeamIds = [...new Set([...teamIds, ...ownedTeamIds])];

        if (allMyTeamIds.length > 0) {
          const { data: myTeams } = await supabase.from('teams').select('*').in('id', allMyTeamIds).order('name');
          const { data: members } = await supabase.from('team_members').select('*').in('team_id', allMyTeamIds);
          const { data: teamProds } = await supabase.from('products').select('*').in('team_id', allMyTeamIds).order('created_at', { ascending: true });
          
          teams = myTeams || [];
          teamMembers = members || [];
          products = teamProds || [];
        }

        // 2. Legacy/Fallback: Fetch products I own directly but aren't in a team yet (should be few after migration)
        const { data: ownedDirectly } = await supabase.from('products').select('*').eq('owner_id', user.id).is('team_id', null);
        if (ownedDirectly && ownedDirectly.length > 0) {
          products = [...products, ...ownedDirectly];
        }
      }

      const allowedProductIds = products.map(p => p.id);

      // 2. Fetch all other data, filtered by allowed products if not HoD
      const getQuery = (table) => {
        let q = supabase.from(table).select('*');
        if (!isHoD && allowedProductIds.length > 0) {
          q = q.in('product_id', allowedProductIds);
        } else if (!isHoD && allowedProductIds.length === 0) {
          // If no products allowed, don't fetch anything but satisfy promise
          q = q.eq('product_id', 'none_existing_id');
        }
        return q;
      };

      logger.info('Performing secondary data fetches...', { allowedProductIds });

      const fetchTable = async (table, query) => {
        try {
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

      const features = await fetchTable('features', getQuery('features'));
      const strategy = await fetchTable('strategy', getQuery('strategy'));
      const roadmaps = await fetchTable('roadmaps', getQuery('roadmaps'));
      const objectives = await fetchTable('objectives', getQuery('objectives'));
      const notes = await fetchTable('notes', getQuery('notes').order('created_at', { ascending: false }));
      const reviews = await fetchTable('reviews', getQuery('reviews'));
      const roadmapBoards = await fetchTable('roadmap_boards', getQuery('roadmap_boards'));
      const customers = await fetchTable('customers', getQuery('customers'));

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
          activeProductId: nextActiveProductId,
          selectedProductIds: products.map(p => p.id),
          activeRoadmapBoardId: nextActiveBoardId
        };
      });
      logger.info('Data fetch successful', { productsCount: products?.length, teamsCount: teams?.length });

      // Auto-seeding removed to prevent infinite loops. Users can add products manually.
      if ((!products || products.length === 0) && isAuthenticated && !isHoD) {
        logger.info('No products found for user, but skipping auto-seed to prevent loops.');
      }
    } catch (error) {
      logger.error('Error fetching data from Supabase:', error);
      setFetchError(error.message || 'שגיאת תקשורת עם בסיס הנתונים');
      setLoading(false);
    } finally {
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
      const { error } = await supabase.from('features').update(sanitized).eq('id', id);
      if (error) throw error;
      setData(prev => ({
        ...prev,
        features: prev.features.map(f => f.id === id ? { ...f, ...updates } : f)
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

  const addDoc = (doc) => {
    setData(prev => ({
      ...prev,
      documentation: [...prev.documentation, { ...doc, id: `doc_${Date.now()}`, product_id: prev.activeProductId, updatedAt: new Date().toISOString().split('T')[0] }]
    }));
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
      const newNote = {
        ...note,
        id: note.id || `note_${Date.now()}`,
        product_id: note.product_id || data.activeProductId
      };
      const { data: inserted, error } = await supabase.from('notes').insert([newNote]).select();
      if (error) {
        console.error('Supabase error in addNote:', error);
        throw error;
      }
      setData(prev => ({ ...prev, notes: [inserted[0], ...(prev.notes || [])] }));
    } catch (err) {
      console.error('Error adding note:', err);
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
      if (!customer) return;

      const newNote = { id: `cn_${Date.now()}`, text: noteText, createdAt: new Date().toISOString() };
      const updatedNotes = [...(customer.notes || []), newNote];

      const { error } = await supabase.from('customers').update({ notes: updatedNotes }).eq('id', customerId);
      if (error) throw error;

      setData(prev => ({
        ...prev,
        customers: prev.customers.map(c => c.id === customerId ? { ...c, notes: updatedNotes } : c)
      }));
    } catch (err) {
      console.error('Error adding customer note:', err);
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
    addRoadmapItem,
    updateRoadmapItem,
    deleteRoadmapItem,
    addNote,
    deleteNote,
    addCustomer,
    updateCustomer,
    addCustomerNote,
    deleteCustomerNote,
    deleteCustomer,
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
