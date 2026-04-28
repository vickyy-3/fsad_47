import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Mail, User, ArrowRight, KeyRound, RefreshCw, Check } from 'lucide-react';
import { toast } from 'react-toastify';

export default function Register() {
  const [step, setStep] = useState(1);
  const [emailValue, setEmailValue] = useState('');
  
  const [otpCode, setOtpCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const role = 'researcher';
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  
  const navigate = useNavigate();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const getContactPayload = () => {
    return emailValue.trim();
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!emailValue) {
      setError('Email cannot be empty.');
      return;
    }
    if (!/^[A-Za-z0-9+_.-]+@gmail\.com$/.test(emailValue)) {
      setError('Only valid @gmail.com email addresses are allowed.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/auth/request-otp', { contact: getContactPayload() });
      toast.success('OTP sent successfully!');
      setStep(2);
      setTimer(60); // Start 60 second cooldown
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
        setError('OTP must be exactly 6 digits.');
        return;
    }
    setError('');
    toast.success('OTP verified locally. Proceed to account setup.');
    setStep(3);
  };

  const handleCompleteRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', { 
          name, 
          contact: getContactPayload(), 
          otpCode, 
          password, 
          role 
      });
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <span className="text-white font-bold text-2xl rotate-3 hover:rotate-0">RP</span>
            </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Create an account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-xl py-10 px-6 shadow-2xl sm:rounded-3xl border border-white sm:px-10 min-h-[450px]">
          
          {/* Step Indicators */}
          <div className="flex justify-center mb-10">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-primary-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`}></div>
              <div className={`w-10 h-1 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
              <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-primary-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`}></div>
              <div className={`w-10 h-1 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-primary-600' : 'bg-slate-200'}`}></div>
              <div className={`w-3 h-3 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-primary-600 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-slate-200'}`}></div>
            </div>
          </div>

          {error && (
              <div className="mb-6 bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-xl text-sm flex items-center animate-in slide-in-from-top-2">
                  <span className="block sm:inline">{error}</span>
              </div>
          )}

          {step === 1 && (
              <form className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleRequestOtp}>
                <div className="text-center mb-8">
                   <h3 className="text-xl font-bold text-slate-900">Contact Details</h3>
                   <p className="text-sm text-slate-500 mt-1">We will send you an OTP to verify.</p>
                </div>

                <div className="min-h-[80px]">
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                        <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                        <div className="relative rounded-xl shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-slate-400" />
                            </div>
                            <input id="email" type="email" autoFocus required value={emailValue} onChange={(e)=>setEmailValue(e.target.value)} className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border border-slate-200 outline-none rounded-xl py-3 px-3 transition-all text-slate-800 bg-white" placeholder="you@gmail.com" />
                        </div>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="cursor-pointer w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 mt-8">
                  {loading ? 'Sending OTP...' : 'Send OTP'} {!loading && <ArrowRight size={18} />}
                </button>
              </form>
          )}

          {step === 2 && (
              <form className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={verifyOtpAndContinue}>
                <div className="text-center mb-8">
                   <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
                       <Check size={24} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900">Verification Code</h3>
                   <p className="text-sm text-slate-500 mt-2">
                       Enter the 6-digit code sent to<br/>
                       <span className="font-semibold text-slate-700">{getContactPayload()}</span>
                   </p>
                </div>
                <div>
                  <div className="mt-2 text-center">
                    <input id="otp" autoFocus type="text" maxLength={6} required value={otpCode} onChange={(e)=>setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full text-center tracking-[1em] text-3xl font-bold border border-slate-200 outline-none rounded-2xl py-4 transition-all text-slate-800 bg-slate-50 shadow-inner" placeholder="••••••" />
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-3 pt-2">
                    <button type="submit" className="cursor-pointer w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 transition-all active:scale-[0.98]">
                      Verify & Continue <ArrowRight size={18} />
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={() => handleRequestOtp()} 
                        disabled={timer > 0 || loading}
                        className="text-sm font-medium text-slate-500 hover:text-primary-600 disabled:opacity-50 transition-colors flex items-center gap-2 mt-2 cursor-pointer"
                    >
                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                        {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                    </button>
                </div>
              </form>
          )}

          {step === 3 && (
              <form className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300" onSubmit={handleCompleteRegister}>
                <div className="text-center mb-6">
                   <h3 className="text-xl font-bold text-slate-900">Setup Account</h3>
                   <p className="text-sm text-slate-500 mt-1">Finalize your profile details.</p>
                </div>
                
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Full Name</label>
                  <div className="mt-2 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                    <input id="name" autoFocus type="text" required value={name} onChange={(e)=>setName(e.target.value)} className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border border-slate-200 outline-none rounded-xl py-3 px-3 transition-all text-slate-800 bg-white" placeholder="John Doe" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700">Password</label>
                  <div className="mt-2 relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-slate-400" />
                    </div>
                    <input id="password" type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="focus:ring-2 focus:ring-primary-500 focus:border-primary-500 block w-full pl-11 sm:text-sm border border-slate-200 outline-none rounded-xl py-3 px-3 transition-all text-slate-800 bg-white" placeholder="••••••••" />
                  </div>
                </div>



                <button type="submit" disabled={loading} className="cursor-pointer w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 transition-all active:scale-[0.98] disabled:opacity-70 mt-8">
                  {loading ? 'Creating...' : 'Complete Registration'} {!loading && <ArrowRight size={18} />}
                </button>
              </form>
          )}

        </div>
      </div>
    </div>
  );
}
