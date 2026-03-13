import React, { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

// Initial dummy data for the application
const defaultData = {
  products: [
    { id: 'prod_1', name: 'מערכת ניהול לקוחות (CRM)', description: 'פלטפורמה מרכזית לניהול קשרי לקוחות ותהליכי מכירה.' },
    { id: 'prod_2', name: 'אפליקציית משלוחים', description: 'פתרון לוגיסטי לניהול משלוחים בזמן אמת.' }
  ],
  activeProductId: 'prod_1',
  strategy: [
    { id: 'strat_1', productId: 'prod_1', type: 'Problem', title: 'פיזור נתונים וחוסר סדר', description: 'צוותי המכירות מתקשים לעקוב אחרי לידים בשל שימוש במספר מערכות נפרדות.' },
    { id: 'strat_2', productId: 'prod_1', type: 'People', title: 'צוותי מכירות ותמיכה', description: 'אנשי מקצוע הזקוקים לתמונת 360 מעלות על הלקוח.' },
    { id: 'strat_3', productId: 'prod_1', type: 'Product', title: 'פלטפורמת Unified CRM', description: 'ריכוז כלל האינטראקציות עם הלקוח במקום אחד עם אוטומציות חכמות.' }
  ],
  features: [
    { id: 'feat_1', productId: 'prod_1', title: 'אינטגרציה עם WhatsApp', reach: 9, impact: 10, confidence: 8, effort: 7, status: 'Planned', objectiveId: 'obj_1', teams: ['Core', 'Mobile'] },
    { id: 'feat_2', productId: 'prod_1', title: 'לוח בקרה למנהלים', reach: 7, impact: 8, confidence: 9, effort: 5, status: 'In Progress', objectiveId: 'obj_2', teams: ['Frontend'] },
    { id: 'feat_3', productId: 'prod_1', title: 'ייצוא דוחות לאקסל', reach: 10, impact: 5, confidence: 10, effort: 2, status: 'Done', teams: ['Backend'] }
  ],
  kpis: [
    { id: 'kpi_1', productId: 'prod_1', title: 'זמן תגובה ממוצע', value: '4.2 דק\'', target: '< 5 דק\'', trend: 15 },
    { id: 'kpi_2', productId: 'prod_1', title: 'שיעור המרת לידים', value: '12.5%', target: '> 10%', trend: 4.5 }
  ],
  roadmaps: [
    { id: 'rm_1', productId: 'prod_1', boardId: 'board_default', title: 'ממשק שיחות צ\'אט', bucket: 'Now', description: 'פיתוח ממשק מאוחד לניהול שיחות וואטסאפ וסמס.' },
    { id: 'rm_2', productId: 'prod_1', boardId: 'board_default', title: 'מערכת תזכורות אוטו\'', bucket: 'Next', description: 'שליחת תזכורות אוטומטיות ללקוחות לפני פגישות.' },
    { id: 'rm_3', productId: 'prod_1', boardId: 'board_default', title: 'חיבור ל-QuickBooks', bucket: 'Later', description: 'סנכרון חשבוניות ותשלומים ישירות ל-CRM.' }
  ],
  objectives: [
    { id: 'obj_1', productId: 'prod_1', title: 'שיפור חווית תקשורת', progress: 45, quarter: 'Q3 2026', teams: ['Core', 'Mobile'], keyResults: [{ title: 'הטמעת 3 ערוצי צ\'אט', progress: 60 }, { title: 'צמצום זמן מענה ב-20%', progress: 30 }] },
    { id: 'obj_2', productId: 'prod_1', title: 'הגדלת מעורבות מנהלים', progress: 70, quarter: 'Q3 2026', teams: ['Design', 'Frontend'], keyResults: [{ title: 'השקת לוח בקרה חדש', progress: 100 }, { title: '100% שימוש שבועי במערכת', progress: 40 }] }
  ],
  documentation: [
    { 
      id: 'doc_1', 
      title: 'תעדוף מוצרים במודל RICE', 
      type: 'Reference', 
      updatedAt: '2026-03-13', 
      content: 'מודל RICE הוא כלי לקביעת סדר עדיפויות המורכב מארבעה גורמים: Reach (תפוצה), Impact (אימפקט), Confidence (ביטחון) ו-Effort (מאמץ). הנוסחה מאפשרת לחשב ציון אובייקטיבי לכל פיצ\'ר ולבחור את אלו שנותנים את הערך המקסימלי במינימום מאמץ.' 
    },
    { 
      id: 'doc_2', 
      title: 'בנייה וניהול של מפת דרכים (Roadmap)', 
      type: 'Guide', 
      updatedAt: '2026-03-13', 
      content: 'מפת דרכים אינה רק רשימת משימות, אלא הצהרת כוונות אסטרטגית. היא יכולה להיות במבנה Kanban (Now, Next, Later) לניהול זרימה, או במבנה Timeline (ציר זמן) לתיאום ציפיות מול לוחות זמנים רבעוניים. מפה טובה מקשרת בין חזון המוצר לבין הפיצ\'רים שנבנים בפועל.' 
    },
    { 
      id: 'doc_3', 
      title: 'הבנת OKRs ו-KPIs', 
      type: 'Strategic', 
      updatedAt: '2026-03-13', 
      content: 'OKRs (Objectives and Key Results) הם כלי להגדרת יעדים שאפתניים ומדידת תוצאות מרכזיות שמראות על התקדמות. KPIs (Key Performance Indicators) הם מדדי ביצוע שוטפים שעוזרים להבין את בריאות המוצר (למשל: זמן תגובה, אחוז נטישה). יחד, הם יוצרים מצפן להצלחה.' 
    },
    { 
      id: 'doc_4', 
      title: 'מודל ה-3Ps: Problem, People, Product', 
      type: 'Framework', 
      updatedAt: '2026-03-13', 
      content: 'ה-3Ps הם הבסיס לכל תוכנית אסטרטגית: 1. Problem - איזו בעיה אנחנו פותרים? 2. People - עבור מי אנחנו פותרים אותה (קהל היעד)? 3. Product - מהו הפתרון שאנחנו מציעים? הבנה עמוקה של שלושתם מבטיחה התאמה של המוצר לשוק (Product-Market Fit).' 
    },
    { 
      id: 'doc_5', 
      title: 'תעדוף לפי ערך עסקי (Value vs Effort)', 
      type: 'Reference', 
      updatedAt: '2026-03-13', 
      content: 'מטריצת "ערך מול מאמץ" עוזרת לזהות "Big Bets" (ערך גבוה, מאמץ גבוה) ו-"Quick Wins" (ערך גבוה, מאמץ נמוך). המטרה היא תמיד לתעדף קודם כל את הניצחונות המהירים כדי לייצר מומנטום חיובי במוצר.' 
    }
  ],
  notes: [
    { id: 'note_1', productId: 'prod_1', title: 'פידבק ממשתמשי בטא', content: 'המשתמשים מאוד אוהבים את מהירות החיפוש החדשה.', tag: 'מעקב', createdAt: new Date().toISOString() }
  ],
  customers: [
    { id: 'cust_1', productId: 'prod_1', name: 'חברת הייטק בע"מ', email: 'office@hitech.co.il', status: 'Active', tier: 'Enterprise', createdAt: new Date().toISOString(), notes: [{ id: 'cn_1', text: 'לקוח אסטרטגי חשוב', createdAt: new Date().toISOString() }] }
  ],
  availableTeams: ['Core', 'Frontend', 'Backend', 'Mobile', 'Design', 'Growth'],
  roadmapBoards: [
    { 
      id: 'board_default', 
      productId: 'prod_1', 
      name: 'מפת דרכים (Kanban)', 
      viewType: 'kanban',
      columns: [
        { key: 'Now', label: 'עכשיו', color: 'blue', icon: 'Zap' },
        { key: 'Next', label: 'הבא', color: 'purple', icon: 'ArrowRight' },
        { key: 'Later', label: 'בעתיד', color: 'yellow', icon: 'Clock' }
      ]
    },
    { 
      id: 'board_quarterly', 
      productId: 'prod_1', 
      name: 'לוח רבעוני (Timeline)', 
      viewType: 'timeline',
      quarter: 'Q3',
      year: '2026'
    }
  ],
  activeRoadmapBoardId: 'board_default',
  reviews: []
};

export const ProductProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('plannr_dark_mode') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('plannr_dark_mode', darkMode);
  }, [darkMode]);

  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('dpm_app_data');
      if (saved) {
        // Merge with defaultData so new fields are added on first run after update
        const parsed = JSON.parse(saved);
        return {
          ...defaultData,
          ...parsed,
          products: parsed.products || defaultData.products,
          strategy: parsed.strategy || defaultData.strategy,
          features: parsed.features || defaultData.features,
          objectives: parsed.objectives || defaultData.objectives,
          roadmaps: parsed.roadmaps || defaultData.roadmaps,
          documentation: [
            ...defaultData.documentation.filter(d => !(parsed.documentation || []).find(pd => pd.id === d.id)),
            ...(parsed.documentation || [])
          ],
          kpis: parsed.kpis || defaultData.kpis,
          notes: parsed.notes || defaultData.notes,
          customers: parsed.customers || defaultData.customers,
          roadmapBoards: parsed.roadmapBoards || defaultData.roadmapBoards,
          activeRoadmapBoardId: parsed.activeRoadmapBoardId || defaultData.activeRoadmapBoardId,
          availableTeams: parsed.availableTeams || defaultData.availableTeams,
          reviews: parsed.reviews || defaultData.reviews,
        };
      }
    } catch (e) {
      console.error("Failed to parse local storage data", e);
    }
    return defaultData;
  });

  useEffect(() => {
    localStorage.setItem('dpm_app_data', JSON.stringify(data));
  }, [data]);

  const setActiveProduct = (id) => {
    setData(prev => {
      const activeBoards = (prev.roadmapBoards || []).filter(b => b.productId === id);
      const newBoardId = activeBoards[0]?.id || 'board_default';
      return { ...prev, activeProductId: id, activeRoadmapBoardId: newBoardId };
    });
  };

  const addProduct = (product) => {
    const defaultBoard = {
      id: `board_${Date.now()}_default`,
      productId: product.id,
      name: 'מפת דרכים ראשית',
      viewType: 'kanban',
      columns: [
        { key: 'Now', label: 'עכשיו', color: 'blue', icon: 'Zap' },
        { key: 'Next', label: 'הבא', color: 'purple', icon: 'ArrowRight' },
        { key: 'Later', label: 'בעתיד', color: 'yellow', icon: 'Clock' }
      ]
    };
    setData(prev => ({ 
      ...prev, 
      products: [...prev.products, product],
      roadmapBoards: [...(prev.roadmapBoards || []), defaultBoard]
    }));
  };

  const addFeature = (productFeature) => {
    setData(prev => ({ 
      ...prev, 
      features: [...prev.features, { ...productFeature, id: `feat_${Date.now()}`, teams: productFeature.teams || [] }] 
    }));
  };

  const addObjective = (objective) => {
    setData(prev => ({
      ...prev,
      objectives: [...prev.objectives, { ...objective, id: `obj_${Date.now()}`, teams: objective.teams || [] }]
    }));
  };

  const updateStrategy = (type, title, description) => {
    setData(prev => {
      const existing = prev.strategy.find(s => s.productId === prev.activeProductId && s.type === type);
      if (existing) {
        return {
          ...prev,
          strategy: prev.strategy.map(s =>
            s.id === existing.id ? { ...s, title, description } : s
          )
        };
      } else {
        return {
          ...prev,
          strategy: [...prev.strategy, { id: `strat_${Date.now()}`, productId: prev.activeProductId, type, title, description }]
        };
      }
    });
  };

  const addDoc = (doc) => {
    setData(prev => ({
      ...prev,
      documentation: [...prev.documentation, { ...doc, id: `doc_${Date.now()}`, productId: prev.activeProductId, updatedAt: new Date().toISOString().split('T')[0] }]
    }));
  };

  const addRoadmapItem = (item) => {
    setData(prev => {
      // Find the actual active board to get its ID
      const activeBoards = (prev.roadmapBoards || []).filter(b => b.productId === prev.activeProductId);
      const activeBoard = activeBoards.find(b => b.id === prev.activeRoadmapBoardId) || activeBoards[0];
      const boardId = activeBoard?.id || '';
      
      return {
        ...prev,
        roadmaps: [...prev.roadmaps, { ...item, id: `rm_${Date.now()}`, productId: prev.activeProductId, boardId }]
      };
    });
  };

  const addRoadmapBoard = (board) => {
    const newId = `board_${Date.now()}`;
    setData(prev => ({
      ...prev,
      roadmapBoards: [...(prev.roadmapBoards || []), { ...board, id: newId, productId: prev.activeProductId, viewType: board.viewType || 'kanban' }],
      activeRoadmapBoardId: newId // Auto-switch to newly created board
    }));
  };

  const updateRoadmapBoard = (id, updates) => {
    setData(prev => ({
      ...prev,
      roadmapBoards: prev.roadmapBoards.map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  const deleteRoadmapBoard = (id) => {
    setData(prev => ({
      ...prev,
      roadmapBoards: prev.roadmapBoards.filter(b => b.id !== id),
      activeRoadmapBoardId: prev.activeRoadmapBoardId === id ? (prev.roadmapBoards.find(b => b.id !== id)?.id || '') : prev.activeRoadmapBoardId
    }));
  };

  const setActiveRoadmapBoard = (id) => {
    setData(prev => ({ ...prev, activeRoadmapBoardId: id }));
  };

  const addNote = (note) => {
    setData(prev => ({
      ...prev,
      notes: [...(prev.notes || []), { ...note, id: `note_${Date.now()}`, createdAt: new Date().toISOString(), productId: prev.activeProductId }]
    }));
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

  const deleteNote = (id) => {
    setData(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  };

  const addCustomer = (customer) => {
    setData(prev => ({
      ...prev,
      customers: [...(prev.customers || []), { ...customer, id: `cust_${Date.now()}`, productId: prev.activeProductId, createdAt: new Date().toISOString(), notes: [] }]
    }));
  };

  const addCustomerNote = (customerId, note) => {
    setData(prev => ({
      ...prev,
      customers: prev.customers.map(c =>
        c.id === customerId
          ? { ...c, notes: [...(c.notes || []), { id: `cn_${Date.now()}`, text: note, createdAt: new Date().toISOString() }] }
          : c
      )
    }));
  };

  const deleteCustomer = (id) => {
    setData(prev => ({ ...prev, customers: prev.customers.filter(c => c.id !== id) }));
  };

  const addReview = (productId, content, itemId = null) => {
    setData(prev => ({
      ...prev,
      reviews: [...(prev.reviews || []), {
        id: `rev_${Date.now()}`,
        productId,
        itemId,
        content,
        status: 'Pending',
        createdAt: new Date().toISOString()
      }]
    }));
  };

  const updateReviewStatus = (reviewId, status) => {
    setData(prev => ({
      ...prev,
      reviews: (prev.reviews || []).map(r => r.id === reviewId ? { ...r, status } : r)
    }));
  };

  // Helper selectors
  const activeProduct = data.products.find(p => p.id === data.activeProductId);
  const activeStrategy = data.strategy.filter(s => s.productId === data.activeProductId);
  const activeFeatures = data.features.filter(f => f.productId === data.activeProductId);
  const activeKpis = data.kpis.filter(k => k.productId === data.activeProductId);
  const activeObjectives = data.objectives.filter(obj => obj.productId === data.activeProductId);
  const activeDocs = data.documentation.filter(doc => !doc.productId || doc.productId === data.activeProductId);
  const activeNotes = (data.notes || []).filter(n => n.productId === data.activeProductId);
  const activeCustomers = (data.customers || []).filter(c => c.productId === data.activeProductId);
  
  const activeRoadmapBoards = (data.roadmapBoards || []).filter(b => b.productId === data.activeProductId);
  
  // Robust fallback for activeRoadmapBoard
  const activeRoadmapBoard = activeRoadmapBoards.find(b => b.id === data.activeRoadmapBoardId) 
    || activeRoadmapBoards[0] 
    || { ...defaultData.roadmapBoards[0], productId: data.activeProductId, id: 'temp_board' };

  const activeRoadmaps = data.roadmaps.filter(rm => 
    rm.productId === data.activeProductId && 
    (rm.boardId === activeRoadmapBoard.id || (!rm.boardId && activeRoadmapBoard.id === 'board_default'))
  );

  const contextValue = {
    data,
    setData,
    setActiveProduct,
    addProduct,
    addFeature,
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
    resetData: () => {
      localStorage.removeItem('dpm_app_data');
      window.location.reload();
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
