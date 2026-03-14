import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Hexagon, LogIn, Mail, Lock, AlertCircle, CheckCircle, Users, Plus, Rocket } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { login, signup, loading, error } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('PM');
  const [success, setSuccess] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

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

  const handleDemoRegistration = async (userRole) => {
    setLocalLoading(true);
    try {
      const demoEmail = `demo_${userRole.toLowerCase()}_${Date.now()}@plannr.io`;
      const demoPass = 'password123';
      const demoName = userRole === 'HoD' ? 'מנהל דמו' : 'מנהל מוצר דמו';

      const ok = await signup(demoEmail, demoPass, userRole, demoName);

      if (ok) {
        // Seed initial data for the demo user
        const { data: user } = await supabase.auth.getUser();
        const userId = user?.user?.id;

        if (!userId) {
          throw new Error("User ID not found after signup.");
        }

        const demoProductId = `prod_demo_${Date.now()}`;
        const demoProduct = {
          id: demoProductId,
          user_id: userId,
          name: 'מוצר דמו ראשי',
          description: 'זהו מוצר דמו שנוצר אוטומטית לצורך בדיקה.',
          created_at: new Date().toISOString()
        };
        const { error: pErr } = await supabase.from('products').insert(demoProduct);
        if (pErr) throw pErr;

        const demoRoadmaps = [
          { id: `rm_demo_1_${Date.now()}`, product_id: demoProductId, title: 'שדרוג מנוע חיפוש', bucket: 'Now', description: 'שיפור ביצועי חיפוש ב-200%.' },
          { id: `rm_demo_2_${Date.now()}`, product_id: demoProductId, title: 'ממשק מובייל חדש', bucket: 'Next', description: 'עיצוב מחדש של חויית המשתמש בנייד.' },
          { id: `rm_demo_3_${Date.now()}`, product_id: demoProductId, title: 'אינטגרציה עם מערכת CRM', bucket: 'Later', description: 'חיבור למערכת ניהול לקוחות קיימת.' }
        ];
        const { error: rErr } = await supabase.from('roadmaps').insert(demoRoadmaps);
        if (rErr) throw rErr;

        const demoObjectives = [
          { id: `obj_demo_1_${Date.now()}`, product_id: demoProductId, title: 'מובילות טכנולוגית 2026', progress: 35, quarter: 'Q3 2026', description: 'השגת יתרון תחרותי באמצעות טכנולוגיות חדשניות.' },
          { id: `obj_demo_2_${Date.now()}`, product_id: demoProductId, title: 'הגדלת נתח שוק ב-10%', progress: 60, quarter: 'Q4 2025', description: 'הרחבת בסיס הלקוחות והגברת המכירות.' }
        ];
        const { error: oErr } = await supabase.from('objectives').insert(demoObjectives);
        if (oErr) throw oErr;

        const demoFeatures = [
          { id: `feat_demo_1_${Date.now()}`, roadmap_id: demoRoadmaps[0].id, title: 'חיפוש סמנטי', description: 'שימוש ב-NLP לשיפור תוצאות החיפוש.', status: 'In Progress', priority: 'High' },
          { id: `feat_demo_2_${Date.now()}`, roadmap_id: demoRoadmaps[0].id, title: 'השלמה אוטומטית', description: 'הצעות חיפוש בזמן הקלדה.', status: 'Planned', priority: 'Medium' },
          { id: `feat_demo_3_${Date.now()}`, roadmap_id: demoRoadmaps[1].id, title: 'עיצוב רספונסיבי', description: 'התאמת הממשק למכשירים ניידים.', status: 'Completed', priority: 'High' }
        ];
        const { error: fErr } = await supabase.from('features').insert(demoFeatures);
        if (fErr) throw fErr;

        alert(`נוצר משתמש דמו (${userRole}) ונתונים לדוגמה: ${demoEmail}\nסיסמה: ${demoPass}\nכעת ניתן להתחבר.`);
        setEmail(demoEmail);
        setPassword(demoPass);
        setIsSignUp(false);
      }
    } catch (err) {
      console.error('Error during demo registration or data seeding:', err);
      alert('שגיאה ביצירת משתמש דמו או טעינת נתונים: ' + err.message);
    } finally {
      setLocalLoading(false);
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

          <button type="submit" className="btn btn-primary w-full py-3" disabled={loading || localLoading}>
            {loading || localLoading ? 'מבצע...' : (
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
          
          <button 
            type="button"
            className="mt-4 flex-center gap-2 w-full py-2 px-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-all duration-300 cursor-pointer"
            onClick={async () => {
              const demoEmail = `test_hod_${Date.now()}@plannr.io`;
              const demoPass = 'password123';
              const ok = await signup(demoEmail, demoPass, 'HoD', 'Testing Admin (HoD)');
              if (ok) {
                alert(`בוצע! משתמש בדיקה נוצר בחשבון ה-Supabase שלך.\nאימייל: ${demoEmail}\nסיסמה: ${demoPass}\nהזן את הפרטים והתחבר.`);
                setEmail(demoEmail);
                setPassword(demoPass);
                setIsSignUp(false);
              }
            }}
          >
            <Rocket size={14} /> צור משתמש בדיקה (HoD) ונתוני דמו
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
