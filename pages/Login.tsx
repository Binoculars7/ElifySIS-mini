/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Card } from '../components/UI';
import { Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';

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

    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgLight dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl border-t-8 border-primary relative">
        <button onClick={() => navigate('/')} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <ArrowLeft size={20} />
        </button>
        
        <div className="text-center mb-8 mt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <span className="text-3xl font-bold text-primary">E</span>
          </div>
          <h1 className="text-2xl font-bold text-textPrimary dark:text-white">Welcome Back</h1>
          <p className="text-textSecondary dark:text-gray-400 mt-2">Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100 dark:border-red-900">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-textSecondary dark:text-gray-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
              <input 
                 type="email" 
                 required
                 className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-primary outline-none"
                 placeholder="admin@store.com"
                 value={email}
                 onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-textSecondary dark:text-gray-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
               <input 
                 type="password" 
                 required
                 className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-gray-400 focus:border-primary outline-none"
                 placeholder="••••••••"
                 value={password}
                 onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 text-base font-bold shadow-lg shadow-primary/30" 
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
            Don't have an account? <button type="button" onClick={() => navigate('/signup')} className="text-primary font-bold hover:underline">Sign Up</button>
          </div>

          <div className="text-center text-xs text-gray-400 mt-4 border-t border-gray-200 dark:border-slate-700 pt-4">
            <p>Demo Account:</p>
            <p>admin@store.com / password</p>
          </div>
        </form>
      </Card>
    </div>
  );
};