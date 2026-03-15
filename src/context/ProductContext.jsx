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
  const { user, isAuthenticated } = useAuth();
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
    logger.info('Fetching all data from Supabase...');
    try {
      const [
        { data: products },
        { data: features },
        { data: strategy },
        { data: roadmaps },
        { data: objectives },
        { data: notes },
        { data: reviews }
      ] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: true }),
        supabase.from('features').select('*'),
        supabase.from('strategy').select('*'),
        supabase.from('roadmaps').select('*'),
        supabase.from('objectives').select('*'),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
        supabase.from('reviews').select('*')
      ]);

      setData(prev => ({
        ...prev,
        products: products || [],
        features: features || [],
        strategy: strategy || [],
        roadmaps: roadmaps || [],
        objectives: objectives || [],
        notes: notes || [],
        reviews: reviews || [],
        activeProductId: products?.[0]?.id || prev.activeProductId
      }));
      logger.info('Data fetch successful', { productsCount: products?.length });

      // Auto-seed if NO products exist for this user
      if ((!products || products.length === 0) && isAuthenticated) {
        await seedInitialData(true); // true means "silent" auto-seed
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
      const demoProduct = { id: demoProductId, name: 'מוצר דמו אסטרטגי', description: 'מוצר לצרכי בדיקה והדגמה.' };

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
      const newBoardId = activeBoards[0]?.id || 'board_default';
      return { ...prev, activeProductId: id, activeRoadmapBoardId: newBoardId };
    });
  };

  const addProduct = async (product) => {
    try {
      const productWithUser = { ...product, user_id: user?.id };
      const { data: newProd, error } = await supabase.from('products').insert([productWithUser]).select();
      if (error) throw error;

      const defaultBoard = {
        id: `board_${Date.now()}_default`,
        product_id: product.id,
        name: 'מפת דרכים ראשית',
        view_type: 'kanban',
        columns: [
          { key: 'Now', label: 'עכשיו', color: 'blue', icon: 'Zap' },
          { key: 'Next', label: 'הבא', color: 'purple', icon: 'ArrowRight' },
          { key: 'Later', label: 'בעתיד', color: 'yellow', icon: 'Clock' }
        ]
      };

      setData(prev => {
        const updatedBoards = [...(prev.roadmapBoards || []), defaultBoard];
        localStorage.setItem('plannr_roadmap_boards', JSON.stringify(updatedBoards));
        return {
          ...prev,
          products: [...prev.products, newProd[0]],
          roadmapBoards: updatedBoards
        };
      });
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
      const newFeature = { ...productFeature, user_id: user?.id };
      const { data: inserted, error } = await supabase.from('features').insert([newFeature]).select();
      if (error) throw error;
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
      const newObj = { ...objective, user_id: user?.id };
      const { data: inserted, error } = await supabase.from('objectives').insert([newObj]).select();
      if (error) throw error;
      setData(prev => ({ ...prev, objectives: [...prev.objectives, inserted[0]] }));
    } catch (err) {
      console.error('Error adding objective:', err);
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
        const newStrat = { product_id: data.activeProductId, type, title, description, user_id: user?.id };
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
      const activeBoards = (data.roadmapBoards || []).filter(b => b.product_id === data.activeProductId);
      const activeBoard = activeBoards.find(b => b.id === data.activeRoadmapBoardId) || activeBoards[0];
      const boardId = activeBoard?.id || '';

      const newItem = { ...item, product_id: data.activeProductId, board_id: boardId, user_id: user?.id };
      const { data: inserted, error } = await supabase.from('roadmaps').insert([newItem]).select();
      if (error) throw error;

      setData(prev => ({
        ...prev,
        roadmaps: [...prev.roadmaps, inserted[0]]
      }));
    } catch (err) {
      console.error('Error adding roadmap item:', err);
    }
  };

  const addRoadmapBoard = (board) => {
    const newBoard = { ...board, id: `board_${Date.now()}`, product_id: data.activeProductId, view_type: board.view_type || 'kanban' };
    setData(prev => {
      const updatedBoards = [...(prev.roadmapBoards || []), newBoard];
      localStorage.setItem('plannr_roadmap_boards', JSON.stringify(updatedBoards));
      return {
        ...prev,
        roadmapBoards: updatedBoards,
        activeRoadmapBoardId: newBoard.id
      };
    });
  };

  const updateRoadmapBoard = (id, updates) => {
    setData(prev => {
      const updatedBoards = (prev.roadmapBoards || []).map(b => b.id === id ? { ...b, ...updates } : b);
      localStorage.setItem('plannr_roadmap_boards', JSON.stringify(updatedBoards));
      return {
        ...prev,
        roadmapBoards: updatedBoards
      };
    });
  };

  const deleteRoadmapBoard = (id) => {
    setData(prev => {
      const updatedBoards = (prev.roadmapBoards || []).filter(b => b.id !== id);
      localStorage.setItem('plannr_roadmap_boards', JSON.stringify(updatedBoards));
      return {
        ...prev,
        roadmapBoards: updatedBoards,
        activeRoadmapBoardId: prev.activeRoadmapBoardId === id ? (updatedBoards.find(b => b.product_id === prev.activeProductId)?.id || '') : prev.activeRoadmapBoardId
      };
    });
  };

  const setActiveRoadmapBoard = (id) => {
    setData(prev => ({ ...prev, activeRoadmapBoardId: id }));
  };

  const addNote = async (note) => {
    try {
      const newNote = { ...note, product_id: data.activeProductId, user_id: user?.id };
      const { data: inserted, error } = await supabase.from('notes').insert([newNote]).select();
      if (error) throw error;
      setData(prev => ({
        ...prev,
        notes: [...(prev.notes || []), inserted[0]]
      }));
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
      const newCust = { ...customer, product_id: data.activeProductId, user_id: user?.id };
      const { data: inserted, error } = await supabase.from('customers').insert([newCust]).select();
      if (error) throw error;
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

  const deleteCustomer = async (id) => {
    try {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
      setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const addReview = async (product_id, content, item_id = null) => {
    try {
      const newReview = { product_id, item_id, content, status: 'Pending', user_id: user?.id };
      const { data: inserted, error } = await supabase.from('reviews').insert([newReview]).select();
      if (error) throw error;
      setData(prev => ({
        ...prev,
        reviews: [...(prev.reviews || []), inserted[0]]
      }));
    } catch (err) {
      console.error('Error adding review:', err);
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
    updateStrategy,
    addDoc,
    addRoadmapItem,
    addNote,
    deleteNote,
    addCustomer,
    addCustomerNote,
    deleteCustomer,
    addReview,
    updateReviewStatus,
    deleteProduct,
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
