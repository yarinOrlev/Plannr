import React from 'react';
import { useProductContext } from '../context/ProductContext';
import './MultiProductSelector.css';

const MultiProductSelector = () => {
  const { products, selectedProductIds, setSelectedProductIds, activeProduct, setActiveProduct } = useProductContext();

  const toggleProduct = (pid) => {
    if (selectedProductIds.includes(pid)) {
      if (selectedProductIds.length > 1) {
        setSelectedProductIds(selectedProductIds.filter(id => id !== pid));
      }
    } else {
      setSelectedProductIds([...selectedProductIds, pid]);
    }
  };

  const isolateProduct = (e, pid) => {
    e.stopPropagation();
    setSelectedProductIds([pid]);
    setActiveProduct(pid);
  };

  if (!products || products.length <= 1) return null;

  return (
    <div className="multi-product-selector-premium animate-fade-in">
      <div className="selector-label">מוצרים להצגה:</div>
      <div className="chips-container">
        {products.map(p => {
          const isActive = selectedProductIds.includes(p.id);
          const isPrimary = p.id === activeProduct?.id;
          
          return (
            <div key={p.id} className="chip-wrapper">
              <button
                className={`product-chip-v2 ${isActive ? 'active' : 'inactive'} ${isPrimary ? 'primary' : ''}`}
                onClick={() => toggleProduct(p.id)}
                title={isPrimary ? 'מוצר פעיל' : 'לחץ לסינון'}
              >
                <span className="chip-dot"></span>
                <span className="chip-text">{p.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MultiProductSelector;
