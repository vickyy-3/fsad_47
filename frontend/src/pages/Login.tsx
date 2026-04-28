import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Lock, ArrowRight, User } from 'lucide-react';

export default function Login() {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contact.includes('@') && !/^[A-Za-z0-9+_.-]+@gmail\.com$/.test(contact)) {
      setError('Only valid @gmail.com email addresses are allowed.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { contact, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
            <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                <span className="text-white font-bold text-2xl -rotate-3">RP</span>
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          New to ResearchPlatform?{' '}
          <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-4 shadow-xl sm:rounded-2xl border border-white/50 sm:px-10">
          {error && (
              <div className="mb-6 bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center">
                  <span className="block sm:inline">{error}</span>
              </div>
          )}
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="contact" className="block text-sm font-semibold text-slate-700">Email or Phone number</label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input id="contact" required value={contact} onChange={(e)=>setContact(e.target.value)} className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border border-slate-200 outline-none rounded-xl py-3 px-3 transition-all text-slate-800 bg-white" placeholder="you@example.com or +123456789" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border border-slate-200 outline-none rounded-xl py-3 px-3 transition-all text-slate-800 bg-white" placeholder="••••••••" />
              </div>
            </div>

            <button type="submit" disabled={loading} className="cursor-pointer w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all active:scale-[0.98] disabled:opacity-70">
              {loading ? 'Signing in...' : 'Sign in'} {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
