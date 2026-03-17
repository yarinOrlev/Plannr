import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        syncProfile(session.user);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        syncProfile(session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const syncProfile = async (userData) => {
    if (!userData) return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: userData.id,
          email: userData.email,
          name: userData.user_metadata?.name || '',
          role: userData.user_metadata?.role || 'PM',
          avatar: userData.user_metadata?.avatar || 'U',
          updated_at: new Date().toISOString()
        })
        .select();
      
      if (error) throw error;
      return profile;
    } catch (err) {
      console.error('Error syncing profile:', err);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }

    setUser(data.user);
    setLoading(false);
    return true;
  };

  const signup = async (email, password, role, name) => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role, // 'HoD' or 'PM'
          name: name,
          avatar: name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return false;
    }

    if (data.user) {
      await syncProfile(data.user);
    }

    setLoading(false);
    return true;
  };

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching all users:', err);
      return [];
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    fetchAllUsers,
    isAuthenticated: !!user,
    isHoD: user?.user_metadata?.role === 'HoD',
    userProfile: {
      id: user?.id,
      name: user?.user_metadata?.name,
      avatar: user?.user_metadata?.avatar,
      role: user?.user_metadata?.role
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
