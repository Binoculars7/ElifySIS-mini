
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/UI';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Normalize inputs: Trim and Lowercase email
    const result = await login(email.trim().toLowerCase(), password.trim());
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white font-sans selection:bg-primary/30 selection:text-white relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/Binoculars7/Learn-V1/refs/heads/main/elifysis.JPG')] bg-cover bg-center opacity-5 mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-slate-950 to-slate-950"></div>

      <div className="w-full max-w-md p-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
         <button onClick={() => navigate('/')} className="absolute -top-12 left-0 text-slate-400 hover:text-white flex items-center gap-2 transition-colors group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform"/> <span className="text-sm font-medium">Back to Home</span>
         </button>

         <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
             <div className="mb-8 text-center">
                 <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg border border-white/20 pb-1 shadow-lg shadow-primary/20 mx-auto mb-4">e</div>
                 <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Welcome back</h1>
                 <p className="text-slate-400 text-sm">Enter your credentials to access your dashboard.</p>
             </div>

             <form onSubmit={handleSubmit} className="space-y-5">
                 {/* Error handling */}
                 {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 border border-red-500/20">
                      <AlertCircle size={20} className="shrink-0 mt-0.5 text-red-500" /> 
                      <span className="leading-relaxed">{error}</span>
                    </div>
                 )}

                 {/* Inputs */}
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 ml-1 uppercase tracking-wider">Email Address</label>
                    <input 
                       type="email" 
                       required
                       className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                       placeholder="admin@store.com"
                       value={email}
                       onChange={e => setEmail(e.target.value)}
                    />
                 </div>

                 <div className="space-y-1.5">
                    <div className="flex justify-between items-center ml-1">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Password</label>
                        <a href="#" className="text-xs text-primary hover:text-blue-400 transition-colors">Forgot?</a>
                    </div>
                    <input 
                       type="password" 
                       required
                       className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                       placeholder="••••••••"
                       value={password}
                       onChange={e => setPassword(e.target.value)}
                    />
                 </div>

                 <Button 
                    type="submit" 
                    className="w-full h-11 text-sm font-bold bg-primary hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] mt-2" 
                    disabled={isLoading}
                 >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                 </Button>

                 <div className="text-center text-slate-400 mt-6 text-sm">
                    Don't have an account? <button type="button" onClick={() => navigate('/signup')} className="text-white font-bold hover:text-primary hover:underline transition-colors ml-1">Sign Up</button>
                 </div>
             </form>
         </div>
             
         <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Demo Credentials</p>
            <div className="inline-block bg-slate-900/50 border border-white/5 rounded-full px-4 py-1.5 text-xs text-slate-400 font-mono">
                admin@store.com / password
            </div>
         </div>
      </div>
    </div>
  );
};
