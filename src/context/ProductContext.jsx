import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import logger from '../utils/logger';

const ProductContext = createContext();

// Initial dummy data for the application (will be used as fallback/seed)
const defaultData = {
  products: [],
  activeProductId: '',
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
  reviews: []
};

export const ProductProvider = ({ children }) => {
  const { user, isAuthenticated, isHoD } = useAuth();
  const [data, setData] = useState(() => {
    const savedBoards = localStorage.getItem('plannr_roadmap_boards');
    return {
      ...defaultData,
      roadmapBoards: savedBoards ? JSON.parse(savedBoards) : []
    };
  });
  const [loading, setLoading] = useState(true);
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
    if (isAuthenticated) {
      fetchAllData();
    } else {
      setData(defaultData);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    logger.info('Fetching compartmentalized data from Supabase...');
    try {
      // 1. Fetch Products based on role and ownership
      let products;
      let sharedProductIds = [];
      let productShares = [];

      if (isHoD) {
        const { data } = await supabase.from('products').select('*').order('created_at', { ascending: true });
        products = data || [];
        // HoD can see all shares to know what's happening
        const { data: shares } = await supabase.from('product_shares').select('*');
        productShares = shares || [];
      } else {
        // Fetch products owned by user
        const { data: owned } = await supabase.from('products').select('*').eq('owner_id', user.id).order('created_at', { ascending: true });
        
        // Fetch products shared WITH user
        const { data: sharesWithMe } = await supabase.from('product_shares').select('product_id').eq('shared_with_id', user.id);
        sharedProductIds = (sharesWithMe || []).map(s => s.product_id);
        
        let sharedProducts = [];
        if (sharedProductIds.length > 0) {
          const { data: shared } = await supabase.from('products').select('*').in('id', sharedProductIds).order('created_at', { ascending: true });
          sharedProducts = shared || [];
        }
        
        products = [...(owned || []), ...sharedProducts];

        // Fetch shares FOR products I own (to manage them)
        const ownedIds = (owned || []).map(p => p.id);
        if (ownedIds.length > 0) {
          const { data: myShares } = await supabase.from('product_shares').select('*').in('product_id', ownedIds);
          productShares = myShares || [];
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

      const [
        { data: features },
        { data: strategy },
        { data: roadmaps },
        { data: objectives },
        { data: notes },
        { data: reviews },
        { data: roadmapBoards },
        { data: customers }
      ] = await Promise.all([
        getQuery('features'),
        getQuery('strategy'),
        getQuery('roadmaps'),
        getQuery('objectives'),
        getQuery('notes').order('created_at', { ascending: false }),
        getQuery('reviews'),
        getQuery('roadmap_boards'),
        getQuery('customers')
      ]);

      setData(prev => ({
        ...prev,
        products: products || [],
        productShares: productShares || [],
        features: features || [],
        strategy: strategy || [],
        roadmaps: roadmaps || [],
        objectives: objectives || [],
        notes: notes || [],
        reviews: reviews || [],
        roadmapBoards: roadmapBoards || [],
        customers: customers || [],
        activeProductId: products?.[0]?.id || prev.activeProductId,
        activeRoadmapBoardId: (roadmapBoards || []).find(b => b.product_id === (products?.[0]?.id || prev.activeProductId))?.id || ''
      }));
      logger.info('Data fetch successful', { productsCount: products?.length });

      // Auto-seed if NO products exist for this user AND not HoD
      if ((!products || products.length === 0) && isAuthenticated && !isHoD) {
        await seedInitialData(true);
      }
    } catch (error) {
      logger.error('Error fetching data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedInitialData = async (silent = false) => {
    setLoading(true);
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
      const newProduct = { 
        id: product.id || `prod_${Date.now()}`, 
        name: product.name, 
        description: product.description,
        owner_id: user.id
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
        // We continue anyway as the product was added, but the UI might be inconsistent
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
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;

      setData(prev => {
        const nextProducts = prev.products.filter(p => p.id !== id);
        return {
          ...prev,
          products: nextProducts,
          activeProductId: prev.activeProductId === id ? (nextProducts[0]?.id || '') : prev.activeProductId
        };
      });
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const addFeature = async (productFeature) => {
    try {
      console.log('ProductContext: addFeature called', { productFeature });
      const newFeature = {
        ...productFeature,
        id: productFeature.id || `feat_${Date.now()}`
      };
      const { data: inserted, error } = await supabase.from('features').insert([newFeature]).select();
      if (error) {
        console.error('Supabase error in addFeature:', error);
        throw error;
      }
      setData(prev => ({ ...prev, features: [...prev.features, inserted[0]] }));
    } catch (err) {
      console.error('Error adding feature:', err);
    }
  };

  const updateFeature = async (id, updates) => {
    try {
      const { error } = await supabase.from('features').update(updates).eq('id', id);
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

  const updateStrategy = async (type, title, description) => {
    try {
      const existing = data.strategy.find(s => s.product_id === data.activeProductId && s.type === type);
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
          product_id: data.activeProductId, 
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
      const activeBoards = (data.roadmapBoards || []).filter(b => b.product_id === data.activeProductId);
      const activeBoard = activeBoards.find(b => b.id === data.activeRoadmapBoardId) || activeBoards[0];
      const fallbackBoardId = activeBoard?.id || '';

      const newItem = { 
        id: item.id || `rm_${Date.now()}`,
        product_id: item.product_id || data.activeProductId, 
        board_id: item.board_id || item.boardId || fallbackBoardId,
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
      const newBoard = { 
        id: `board_${Date.now()}`,
        product_id: data.activeProductId, 
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
    try {
      const { error } = await supabase.from('product_shares').insert([{
        product_id: productId,
        shared_with_id: userId
      }]);
      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (err) {
      console.error('Error sharing product:', err);
      return false;
    }
  };

  const unshareProduct = async (productId, userId) => {
    try {
      const { error } = await supabase.from('product_shares').delete().eq('product_id', productId).eq('shared_with_id', userId);
      if (error) throw error;
      await fetchAllData();
      return true;
    } catch (err) {
      console.error('Error unsharing product:', err);
      return false;
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
  const activeProduct = data.products.find(p => p.id === data.activeProductId);
  const activeStrategy = data.strategy.filter(s => s.product_id === data.activeProductId);
  const activeFeatures = data.features.filter(f => f.product_id === data.activeProductId);
  const activeKpis = (data.kpis || []).filter(k => k.product_id === data.activeProductId);
  const activeObjectives = data.objectives.filter(obj => obj.product_id === data.activeProductId);
  const activeDocs = data.documentation.filter(doc => !doc.product_id || doc.product_id === data.activeProductId);
  const activeNotes = (data.notes || []).filter(n => n.product_id === data.activeProductId);
  const activeCustomers = (data.customers || []).filter(c => c.product_id === data.activeProductId);

  const activeRoadmapBoards = (data.roadmapBoards || []).filter(b => b.product_id === data.activeProductId);

  // Robust fallback for activeRoadmapBoard
  const activeRoadmapBoard = activeRoadmapBoards.find(b => b.id === data.activeRoadmapBoardId)
    || activeRoadmapBoards[0]
    || { product_id: data.activeProductId, id: 'board_default', name: 'מפת דרכים', columns: [] };

  const activeRoadmaps = data.roadmaps.filter(rm =>
    rm.product_id === data.activeProductId &&
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
    shareProduct,
    unshareProduct,
    products: data.products || [],
    productShares: data.productShares || [],
    activeProduct,
    activeStrategy,
    activeFeatures,
    activeKpis,
    activeRoadmaps,
    activeObjectives,
    activeDocs,
    activeNotes,
    activeCustomers,
    darkMode,
    loading,
    searchTerm,
    setSearchTerm,
    toggleDarkMode: () => setDarkMode(!darkMode),
    addAvailableTeam,
    removeAvailableTeam,
    availableTeams: data.availableTeams || [],
    roadmapBoards: activeRoadmapBoards,
    activeRoadmapBoard,
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
