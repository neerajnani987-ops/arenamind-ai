import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, User, AlertCircle, ShieldAlert } from 'lucide-react';

export const Signup: React.FC = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('spectator');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all registration fields.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signup(email, name, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1d] px-4 py-8 text-white relative">
      <div className="absolute top-1/4 left-1/4 w-85 h-85 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <div className="w-full max-w-md rounded-2xl glass-panel p-8 border border-white/10 shadow-glass space-y-6">
        
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center font-bold text-white shadow-neon text-lg mx-auto">
            AM
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Create ArenaMind Account</h2>
          <p className="text-xs text-white/50">Register your seat ticket or sign up as stadium staff.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-[10px] text-white/50 uppercase font-bold block mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30" size={14} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sam Spectator"
                className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-xs"
                required
                id="txt-signup-name"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/50 uppercase font-bold block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30" size={14} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sam@spectator.com"
                className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-xs"
                required
                id="txt-signup-email"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white/50 uppercase font-bold block mb-1">Platform Role</label>
            <div className="relative">
              <ShieldAlert className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/30" size={14} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full glass-input rounded-lg pl-10 pr-4 py-2 text-xs"
                id="select-signup-role"
              >
                <option className="bg-[#0f172a]" value="spectator">Spectator (Default)</option>
                <option className="bg-[#0f172a]" value="organizer">Organizer Operations</option>
                <option className="bg-[#0f172a]" value="volunteer">Volunteer Assistant</option>
                <option className="bg-[#0f172a]" value="security">Security Patrol</option>
                <option className="bg-[#0f172a]" value="medical">Medical Dispatcher</option>
              </select>
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
                id="txt-signup-password"
              />
            </div>
          </div>

          <div className="text-[11px] pt-1">
            <span className="text-white/40 mr-1.5">Already have an account?</span>
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">Sign In</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-neon transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            id="btn-signup-submit"
          >
            <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
export default Signup;
