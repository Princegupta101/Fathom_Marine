import { useState } from 'react';
import  type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Anchor, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@fathommarine.com');
  const [password, setPassword] = useState('admin123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ color: 'var(--ocean-600)', background: 'rgba(42,143,212,0.15)', padding: '0.6rem', borderRadius: '10px' }}>
            <Anchor size={28} />
          </div>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '1.25rem' }}>Fathom Marine</div>
            <div className="text-xs text-muted">Maritime Operations Platform</div>
          </div>
        </div>

        <div className="auth-title">Sign In</div>
        <div className="auth-sub">Enter your credentials to access the platform</div>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" className="form-input" style={{ paddingLeft: '2.25rem' }}
                value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type={showPw ? 'text' : 'password'} className="form-input" style={{ paddingLeft: '2.25rem', paddingRight: '2.5rem' }}
                value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: '0.5rem', justifyContent: 'center' }}>
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <div className="divider" />
          <div className="text-xs text-muted" style={{ marginBottom: '0.75rem' }}>Quick access for demo:</div>
          <div className="flex gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => quickLogin('admin@fathommarine.com', 'admin123')}>
              👑 Admin
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => quickLogin('john.smith@fathommarine.com', 'crew123')}>
              ⚓ Crew (Ship 1)
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => quickLogin('david.chen@fathommarine.com', 'crew123')}>
              ⚓ Crew (Ship 2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
