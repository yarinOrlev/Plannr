import React, { useState } from 'react';
import { useProductContext } from '../context/ProductContext';
import { useAuth } from '../context/AuthContext';
import { Compass, Users, Lightbulb, AlertTriangle, Pencil, X, Check } from 'lucide-react';
import MultiProductSelector from '../components/MultiProductSelector';
import './Strategy.css';

const StrategyCard = ({ item, colorClass, icon, onEdit, isDeveloper }) => (
  <div className="strategy-card glass-panel">
    <div className="strategy-card-header">
      <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
        <div className={`icon-badge ${colorClass}`}>{icon}</div>
        <h3 className="text-h3">{item.typeLabel || item.type}</h3>
      </div>
      {!isDeveloper && (
        <button className="btn-icon" onClick={() => onEdit(item)} title="עריכה">
          <Pencil size={15} />
        </button>
      )}
    </div>
    <div className="strategy-card-body mt-4">
      <h4 className="text-lg font-medium mb-2">{item.title}</h4>
      <p className="text-secondary">{item.description}</p>
    </div>
  </div>
);

const TYPE_LABELS = { Problem: 'בעיה', People: 'קהל יעד', Product: 'הפתרון', Vision: 'חזון' };

const Strategy = () => {
  const {
    activeProduct,
    selectedProductIds,
    updateStrategy,
    data
  } = useProductContext();
  const { isDeveloper } = useAuth();

  const [activeTab, setActiveTab] = useState(selectedProductIds[0] || '');
  const [editItem, setEditItem] = useState(null);

  // Keep the active product tab valid as the selection changes.
  React.useEffect(() => {
    if (!selectedProductIds.includes(activeTab)) {
      setActiveTab(selectedProductIds[0] || '');
    }
  }, [selectedProductIds, activeTab]);

  if (!activeProduct) return null;

  const handleSave = () => {
    if (!editItem?.title?.trim() && editItem?.type !== 'Vision') return;
    updateStrategy(editItem.type, editItem.title || '', editItem.description, editItem.product_id);
    setEditItem(null);
  };

  const handleEdit = (item, productId) => {
    setEditItem({ ...item, product_id: productId });
  };

  const handleEditVision = (vision, productId) => {
    setEditItem({
      type: 'Vision',
      title: 'חזון המוצר',
      description: vision?.description || '',
      product_id: productId
    });
  };

  return (
    <div className="content-area animate-fade-in strategy-layout">
      <header className="page-header">
        <div>
          <h1 className="text-h1 mb-2">אסטרטגיית מוצר</h1>
          <p className="text-secondary text-lg">הגדרת חזון, קהל יעד ותכנון אסטרטגי</p>
        </div>
      </header>

      <MultiProductSelector />

      {/* Internal Tabs Navigation */}
      <div className="strategy-tabs-nav mb-8">
        {selectedProductIds.map(pid => {
          const product = data.products.find(p => p.id === pid);
          if (!product) return null;
          return (
            <button 
              key={pid}
              className={`strategy-tab-item ${activeTab === pid ? 'active' : ''}`}
              onClick={() => setActiveTab(pid)}
            >
              <Compass size={16} />
              {product.name}
              {pid === activeProduct.id && <span className="tab-primary-dot"></span>}
            </button>
          );
        })}
      </div>

      {editItem && (
        <div className="strategy-modal-overlay premium-blur" onClick={() => setEditItem(null)}>
          <div className="strategy-modal premium-modal glass-panel animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header-premium mb-8">
              <div className="flex-center gap-3" style={{ justifyContent: 'flex-start' }}>
                <div className="icon-badge-sm bg-accent-primary"><Pencil size={20} /></div>
                <h3 className="text-h2">עריכת {TYPE_LABELS[editItem.type]}</h3>
              </div>
              <button className="close-btn-premium" onClick={() => setEditItem(null)}><X size={24} /></button>
            </div>

            <div className="modal-body-premium">
              {editItem.type !== 'Vision' && (
                <div className="input-group-premium">
                  <label className="input-label-premium">כותרת הפריט</label>
                  <input 
                    autoFocus 
                    type="text" 
                    className="premium-input" 
                    value={editItem.title}
                    onChange={e => setEditItem({...editItem, title: e.target.value})} 
                    placeholder="הזן כותרת קצרה וממוקדת..." 
                  />
                </div>
              )}
              <div className="input-group-premium">
                <label className="input-label-premium">
                  {editItem.type === 'Vision' ? 'חזון המוצר המלא' : 'תיאור מפורט'}
                </label>
                <textarea 
                  autoFocus={editItem.type === 'Vision'} 
                  className="premium-input premium-textarea" 
                  rows={editItem.type === 'Vision' ? 8 : 4} 
                  value={editItem.description}
                  onChange={e => setEditItem({...editItem, description: e.target.value})} 
                  placeholder={editItem.type === 'Vision' ? "כתוב כאן את חזון המוצר בצורה מעוררת השראה..." : "פרט כאן את המהות..."} 
                />
              </div>
            </div>

            <div className="modal-footer-premium mt-10">
              <button className="btn btn-secondary btn-lg" onClick={() => setEditItem(null)}>ביטול</button>
              <button className="btn btn-primary btn-lg px-8" onClick={handleSave}>
                <Check size={20} /> שמירת שינויים
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="strategy-tab-content">
        {(() => {
            const product = data.products.find(p => p.id === activeTab);
            if (!product) return null;
            const productStrategy = data.strategy.filter(s => s.product_id === activeTab);
            const getStrategyItem = (type) => {
              const found = productStrategy.find(s => s.type === type);
              return found
                ? { ...found, typeLabel: TYPE_LABELS[type] }
                : { type, typeLabel: TYPE_LABELS[type], title: 'לא הוגדר', description: 'לחץ על עריכה כדי להוסיף.' };
            };

            const problem = getStrategyItem('Problem');
            const people  = getStrategyItem('People');
            const solution = getStrategyItem('Product');
            const vision  = productStrategy.find(s => s.type === 'Vision');

            return (
              <div key={activeTab} className="product-strategy-section animate-scale-in">
                <div className="strategy-grid mb-8">
                  <StrategyCard item={problem} icon={<AlertTriangle size={24}/>} colorClass="bg-red"   onEdit={(item) => handleEdit(item, activeTab)} isDeveloper={isDeveloper} />
                  <StrategyCard item={people}  icon={<Users size={24}/>}         colorClass="bg-blue"  onEdit={(item) => handleEdit(item, activeTab)} isDeveloper={isDeveloper} />
                  <StrategyCard item={solution} icon={<Lightbulb size={24}/>}     colorClass="bg-green" onEdit={(item) => handleEdit(item, activeTab)} isDeveloper={isDeveloper} />
                </div>

                <div className="vision-section glass-panel">
                  <div className="vision-header-container">
                    <div className="vision-header">
                      <Compass size={26} />
                      <h2 className="text-h2">חזון המוצר</h2>
                    </div>
                    {!isDeveloper && (
                      <button className="btn-icon" onClick={() => handleEditVision(vision, activeTab)} title="עריכת חזון">
                        <Pencil size={18} />
                      </button>
                    )}
                  </div>
                  <p className="vision-text text-lg text-secondary leading-relaxed">
                    {vision?.description ? (
                      vision.description
                    ) : (
                      <>
                        עבור <strong className="text-primary">{people.title}</strong> הנאבקים עם{' '}
                        <strong className="text-primary">{problem.title}</strong>,{' '}
                        <strong className="text-primary">{product.name}</strong> מספק{' '}
                        <em>{solution.description}</em>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
};

export default Strategy;
