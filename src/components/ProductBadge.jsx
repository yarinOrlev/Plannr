import React from 'react';

const PRODUCT_COLORS = [
  { bg: '#EEF2FF', border: '#6366F1', text: '#3730A3' }, // Indigo
  { bg: '#F0FDF4', border: '#22C55E', text: '#166534' }, // Emerald
  { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' }, // Blue
  { bg: '#F8FAFC', border: '#64748B', text: '#334155' }, // Slate
  { bg: '#FFF1F2', border: '#F43F5E', text: '#9F1239' }, // Rose
  { bg: '#FAF5FF', border: '#A855F7', text: '#6B21A8' }, // Purple
];

export function getProductColor(productId) {
  if (!productId) return PRODUCT_COLORS[0];
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = productId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PRODUCT_COLORS[Math.abs(hash) % PRODUCT_COLORS.length];
}

const ProductBadge = ({ productName, productId, className = '' }) => {
  if (!productName) return null;
  const col = getProductColor(productId);
  
  return (
    <span 
      className={`font-bold uppercase tracking-wider ${className}`}
      style={{ 
        background: col.bg, 
        color: col.text, 
        whiteSpace: 'nowrap',
        boxShadow: `0 0 0 1px ${col.border}40`,
        borderRadius: '4px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.7rem', // slightly bigger (11.2px)
        padding: '0.25rem 0.5rem',
        lineHeight: '1.2'
      }}
    >
      {productName}
    </span>
  );
};

export default ProductBadge;
