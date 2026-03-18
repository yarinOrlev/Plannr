import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProductContext } from '../context/ProductContext';
import { X, UserPlus, Shield, UserMinus, Search, Loader2 } from 'lucide-react';
import './Header.css'; // Reuse modal styles from Header

const SharingModal = ({ productId, productName, onClose }) => {
  const { fetchAllUsers, userProfile, isHoD } = useAuth();
  const { teams, teamMembers, addTeamMember, removeTeamMember, activeProduct } = useProductContext();
  
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const team = teams.find(t => t.id === activeProduct?.team_id);
  const isOwner = team?.owner_id === userProfile?.id || isHoD;

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      const users = await fetchAllUsers();
      // Filter out current user
      setAllUsers(users.filter(u => u.id !== userProfile?.id));
      setLoading(false);
    };
    loadUsers();
  }, [fetchAllUsers, userProfile?.id]);

  const currentMembers = teamMembers.filter(m => m.team_id === team?.id);
  const memberIds = currentMembers.map(m => m.user_id);

  const handleToggleMember = async (userId) => {
    if (!team) return;
    setActionLoading(userId);
    if (memberIds.includes(userId)) {
      await removeTeamMember(team.id, userId);
    } else {
      await addTeamMember(team.id, userId);
    }
    setActionLoading(null);
  };

  const filteredUsers = allUsers.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="strategy-modal-overlay" onClick={onClose}>
      <div className="strategy-modal glass-panel sharing-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="flex-between mb-4">
          <div>
            <h3 className="text-h3">ניהול צוות: {team?.name || 'ללא צוות'}</h3>
            <p className="text-xs text-tertiary">נהל את חברי הצוות שיכולים לצפות ולערוך מוצרים בצוות זה</p>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        {!isOwner && (
          <div className="alert alert-info mb-4 text-sm" style={{ padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <Shield size={14} className="inline-block mr-1" /> רק מנהל הצוות או ראש מחלקה יכולים לנהל חברים.
          </div>
        )}

        <div className="search-bar mb-4" style={{ position: 'relative', width: '100%' }}>
          <input 
            type="text" 
            placeholder="חפש משתמשים לפי שם או אימייל..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.6rem 2.5rem 0.6rem 0.85rem', 
              borderRadius: 'var(--border-radius-sm)',
              border: '1.5px solid var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              direction: 'rtl'
            }}
          />
          <div style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}>
            <Search size={16} />
          </div>
        </div>

        <div className="users-list" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {loading ? (
            <div className="flex-center p-8"><Loader2 className="animate-spin" size={24} /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center p-8 text-tertiary text-sm">לא נמצאו משתמשים</div>
          ) : (
            filteredUsers.map(u => {
              const isShared = sharedWithIds.includes(u.id);
              return (
                <div key={u.id} className="user-item flex-between p-2 rounded hover:bg-secondary/50 transition-colors" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                  <div className="flex-center gap-2">
                    <div className="user-avatar-sm" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                      {u.avatar || u.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-col">
                      <span className="text-sm font-semibold">{u.name}</span>
                      <span className="text-xs text-tertiary">{u.email}</span>
                    </div>
                  </div>
                  
                  {isOwner ? (
                    <button 
                      className={`btn-icon-sm ${memberIds.includes(u.id) ? 'text-danger' : 'text-primary'}`}
                      onClick={() => handleToggleMember(u.id)}
                      disabled={actionLoading === u.id}
                      title={memberIds.includes(u.id) ? 'הסר מהצוות' : 'הוסף לצוות'}
                    >
                      {actionLoading === u.id ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : memberIds.includes(u.id) ? (
                        <UserMinus size={18} />
                      ) : (
                        <UserPlus size={18} />
                      )}
                    </button>
                  ) : (
                    memberIds.includes(u.id) ? <div className="text-xs text-primary font-medium px-2 py-1 bg-primary/10 rounded">חבר צוות</div> : null
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn btn-secondary w-full" onClick={onClose}>סגור</button>
        </div>
      </div>
    </div>
  );
};

export default SharingModal;
