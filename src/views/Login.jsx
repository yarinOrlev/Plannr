import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Hexagon, LogIn, Mail, Lock, AlertCircle, CheckCircle, Users, Plus } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { login, signup, loading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PM');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp) {
      const ok = await signup(email, password, role, name);
      if (ok) {
        setSuccess(true);
        setTimeout(() => {
          setIsSignUp(false);
          setSuccess(false);
        }, 2000);
      }
    } else {
      await login(email, password);
    }
  };


  return (
    <div className="login-page">
      <div className="login-container glass-panel animate-scale-in">
        <div className="login-header">
          <Hexagon className="logo-icon text-gradient mb-4" size={48} />
          <h1 className="text-h1 text-gradient">Plannr</h1>
          <p className="text-secondary mt-2">
            {isSignUp ? 'יצירת חשבון חדש' : 'ברוכים הבאים למערכת ניהול המוצר'}
          </p>
        </div>

        <form className="login-form mt-8" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error flex-center gap-2 mb-4">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="login-success flex-center gap-2 mb-4 bg-success/10 border-success/20 text-success p-3 rounded-lg text-sm">
              <CheckCircle size={18} />
              <span>נרשמת בהצלחה! מעביר להתחברות...</span>
            </div>
          )}

          {isSignUp && (
            <div className="form-group mb-4">
              <label className="text-xs font-bold text-tertiary mb-2 block">שם מלא</label>
              <div className="input-with-icon">
                <Users size={18} className="input-icon" />
                <input
                  type="text"
                  className="modal-input"
                  placeholder="ישראל ישראלי"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group mb-4">
            <label className="text-xs font-bold text-tertiary mb-2 block">אימייל</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                className="modal-input"
                placeholder="yours@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group mb-4">
            <label className="text-xs font-bold text-tertiary mb-2 block">סיסמה</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                className="modal-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="form-group mb-6">
              <label className="text-xs font-bold text-tertiary mb-2 block">תפקיד במערכת</label>
              <div className="flex-center gap-4">
                <button 
                  type="button" 
                  className={`btn flex-1 text-xs py-2 ${role === 'PM' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRole('PM')}
                >
                  מנהל מוצר (PM)
                </button>
                <button 
                  type="button" 
                  className={`btn flex-1 text-xs py-2 ${role === 'HoD' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRole('HoD')}
                >
                  ראש מחלקה (HoD)
                </button>
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading}>
            {loading ? 'מבצע...' : (
              <>{isSignUp ? <Plus size={18} className="ml-2" /> : <LogIn size={18} className="ml-2" />} 
              {isSignUp ? 'הרשמה' : 'התחברות'}</>
            )}
          </button>
        </form>

        <div className="login-footer mt-8 pt-6 border-t border-color">
          <button 
            className="text-indigo text-sm font-semibold hover:underline bg-transparent border-none cursor-pointer block w-full text-center"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'כבר יש לך חשבון? התחבר' : 'אין לך חשבון עדיין? הירשם'}
          </button>
          

          
          {!isSignUp && (
            <p className="text-[10px] text-tertiary mt-4 text-center">
              הנתונים יישמרו בענן של Supabase
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
