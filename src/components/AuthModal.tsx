import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, Shield, CheckCircle2, AlertTriangle, ArrowRight, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { api, setStoredToken } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
  initialMode?: 'login' | 'signup';
}

type Role = 'student' | 'responder' | 'admin';

const ROLE_OPTIONS: { value: Role; label: string; description: string; color: string }[] = [
  { value: 'student', label: 'Student', description: 'Report emergencies & track incidents', color: 'blue' },
  { value: 'responder', label: 'Responder', description: 'Respond to dispatched emergencies', color: 'emerald' },
  { value: 'admin', label: 'Admin', description: 'Command center & full oversight', color: 'red' },
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'verify_signup_otp' | 'verify_login_otp'>(initialMode);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName(''); setEmail(''); setPassword(''); setRole('student');
    setDepartment(''); setPhoneNumber(''); setOtpCode('');
    setErrorMessage(null); setSuccessMessage(null);
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.signup({ name, email, password, role, department, phoneNumber });
      setPendingEmail(res.email);
      setSuccessMessage(res.message);
      setMode('verify_signup_otp');
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.verifySignupOtp(pendingEmail, otpCode);
      setSuccessMessage(res.message);
      setMode('login');
      setEmail(pendingEmail);
      setPassword('');
      setOtpCode('');
    } catch (err: any) {
      setErrorMessage(err.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await api.login({ email, password });
      if (res.step === 'otp_required') {
        setPendingEmail(res.email);
        setSuccessMessage(res.message);
        setMode('verify_login_otp');
      }
    } catch (err: any) {
      if (err.data?.unverified) {
        setPendingEmail(err.data.email);
        setErrorMessage(err.message);
        setMode('verify_signup_otp');
      } else {
        setErrorMessage(err.message || 'Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.verifyLoginOtp(pendingEmail, otpCode);
      setStoredToken(res.token);
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async (purpose: 'signup' | 'login') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.resendOtp(pendingEmail, purpose);
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Resend cooldown in effect');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedRoleInfo = ROLE_OPTIONS.find(r => r.value === role)!;
  const roleColorMap: Record<Role, string> = {
    student: 'border-blue-500 bg-blue-50 text-blue-700',
    responder: 'border-emerald-500 bg-emerald-50 text-emerald-700',
    admin: 'border-red-500 bg-red-50 text-red-700',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-red-600">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <h2 className="font-extrabold text-base">
              {mode === 'login' && 'Sign In to RescueGrid'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'verify_signup_otp' && 'Verify Email Address'}
              {mode === 'verify_login_otp' && 'Two-Step Login Verification'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Mode 1: Login Form */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-900/30 transition-all"
            >
              <span>{isLoading ? 'Authenticating...' : 'Continue to 2-Step OTP'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { resetForm(); setMode('signup'); }}
                className="text-red-600 font-bold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Signup Form */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="p-6 space-y-3.5 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">

            {/* Role Selector */}
            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase mb-2">Register As *</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`p-2.5 rounded-lg border-2 text-center transition-all cursor-pointer ${
                      role === opt.value
                        ? roleColorMap[opt.value]
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] leading-tight mt-0.5 opacity-75">{opt.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Jordan Lee"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
              />
              <span className="text-[10px] text-slate-400">A 6-digit OTP will be dispatched to this address.</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Phone</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 text-xs uppercase mb-1">Password (Min 6 chars) *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-red-900/30 transition-all text-xs"
            >
              <span>{isLoading ? 'Creating Account...' : `Register as ${selectedRoleInfo.label} & Send OTP`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-slate-500 pt-1 border-t border-slate-100">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { resetForm(); setMode('login'); }}
                className="text-red-600 font-bold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* Mode 3 & 4: OTP Verification */}
        {(mode === 'verify_signup_otp' || mode === 'verify_login_otp') && (
          <form
            onSubmit={mode === 'verify_signup_otp' ? handleVerifySignupOtp : handleVerifyLoginOtp}
            className="p-6 space-y-4 text-xs sm:text-sm text-center"
          >
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900">Enter 6-Digit Code</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dispatched to <strong className="text-slate-800">{pendingEmail}</strong>
              </p>
            </div>

            <div>
              <input
                type="text"
                required
                maxLength={6}
                pattern="[0-9]{6}"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-48 mx-auto text-center font-mono font-black text-2xl tracking-widest px-3 py-2.5 border-2 border-slate-300 rounded-lg focus:outline-none focus:border-red-600"
                autoFocus
              />
              <span className="text-[11px] text-slate-400 block mt-1">Valid for 5 minutes (Max 5 attempts)</span>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all text-xs"
            >
              <span>{isLoading ? 'Verifying OTP...' : 'Verify Code & Proceed'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>

            <div className="pt-2 flex justify-between items-center text-xs">
              <button
                type="button"
                onClick={() => handleResendOtp(mode === 'verify_signup_otp' ? 'signup' : 'login')}
                className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Resend Code
              </button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
