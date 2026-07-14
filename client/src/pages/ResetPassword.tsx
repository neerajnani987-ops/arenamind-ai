import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { ProblemSolutionBenefit } from '../components/ui/ProblemSolutionBenefit';

export const ResetPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      await resetPassword(email);
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Error sending password reset request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0f1d] px-4 py-8 text-white relative space-y-4">
      <ProblemSolutionBenefit page="forgot-password" />

      <div className="w-full max-w-md rounded-2xl glass-panel p-8 border border-white/10 shadow-glass space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold tracking-tight">Reset Password</h2>
          <p className="text-xs text-white/50">Send password reset instructions to your inbox.</p>
        </div>

        {success && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-lg flex items-center space-x-2 text-emerald-300 text-xs">
            <CheckCircle size={16} className="shrink-0" />
            <span>If an account exists, a reset link has been dispatched.</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-center space-x-2 text-rose-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
                id="txt-reset-email"
              />
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1">
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold font-mono">Back to Login</Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-neon transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            id="btn-reset-submit"
          >
            <span>{loading ? 'Processing...' : 'Send Reset Instructions'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default ResetPassword;
