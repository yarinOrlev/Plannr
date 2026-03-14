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
      setLoading(false);
    };

    getSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

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

    setLoading(false);
    return true;
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
    isAuthenticated: !!user,
    isHoD: user?.user_metadata?.role === 'HoD',
    userProfile: {
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
