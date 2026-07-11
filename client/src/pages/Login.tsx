import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    { email: 'spectator@arenamind.ai', label: 'Spectator' },
    { email: 'organizer@arenamind.ai', label: 'Organizer' },
    { email: 'volunteer@arenamind.ai', label: 'Volunteer' },
    { email: 'security@arenamind.ai', label: 'Security' },
    { email: 'medical@arenamind.ai', label: 'Medical' },
    { email: 'admin@arenamind.ai', label: 'Admin' }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (targetEmail: string) => {
    setLoading(true);
    setError('');
    try {
      await login(targetEmail);
      navigate('/dashboard');
    } catch {
      setError('Quick login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] px-4 py-8 text-white relative">
      {/* Background elements */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md rounded-2xl glass-panel p-8 border border-white/10 shadow-glass space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white shadow-neon text-lg mx-auto">
            AM
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight font-sans">ArenaMind AI Operations</h2>
          <p className="text-xs text-white/50">Enter credentials or select a quick-access simulation portal.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[10px] text-white/50 uppercase font-bold block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. administrator@arenamind.ai"
                className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-xs"
                required
                id="txt-login-email"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/50 uppercase font-bold block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30" size={14} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-xs"
                required
                id="txt-login-password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1">
            <Link to="/forgot-password" className="text-indigo-400 hover:text-indigo-300 font-semibold">Forgot Password?</Link>
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">Create account</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-neon transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            id="btn-login-submit"
          >
            <span>{loading ? 'Entering Portal...' : 'Sign In to Dashboard'}</span>
          </button>
        </form>

        {/* Quick Simulator Accounts */}
        <div className="space-y-2.5 pt-4 border-t border-white/10">
          <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center">Simulation Portals</div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((pr) => (
              <button
                key={pr.label}
                type="button"
                onClick={() => handleQuickLogin(pr.email)}
                disabled={loading}
                className="py-1.5 bg-white/5 hover:bg-indigo-600 border border-white/5 hover:border-transparent rounded font-semibold text-[10px] text-white/80 hover:text-white transition-all disabled:opacity-50"
                id={`btn-preset-login-${pr.label.toLowerCase()}`}
              >
                {pr.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
export default Login;
