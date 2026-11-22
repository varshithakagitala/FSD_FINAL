import React from 'react';
import { Shield, AlertTriangle, UserCheck, Calculator, Radio, LogIn, LogOut, Database } from 'lucide-react';
import { User, SystemStatus } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'portal' | 'report' | 'admin' | 'responder' | 'engine' | 'docs';
  setActiveTab: (tab: 'portal' | 'report' | 'admin' | 'responder' | 'engine' | 'docs') => void;
  onOpenReportModal: () => void;
  onOpenAuthModal: (mode: 'login' | 'signup') => void;
  onLogout: () => void;
  systemStatus: SystemStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenReportModal,
  onOpenAuthModal,
  onLogout,
  systemStatus,
}) => {
  const normalizedRole = currentUser?.role?.toLowerCase();

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b-2 border-red-600 text-white shadow-md">
      {/* Emergency Hotline Top Bar */}
      <div className="bg-red-700 px-4 py-1.5 text-xs font-semibold flex flex-wrap justify-between items-center text-white">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          <span>CAMPUS EMERGENCY HOTLINE: <strong>(555) 019-9111</strong> or Dial 911 for Immediate Danger</span>
        </div>
        <div className="flex items-center gap-3 text-red-100 text-[11px]">
          <div className="flex items-center gap-1.5 font-mono">
            <Database className="w-3 h-3 text-amber-300" />
            <span>
              {systemStatus?.database.connectionMode === 'atlas' ? (
                <strong className="text-emerald-300">MongoDB Atlas Connected</strong>
              ) : (
                <strong className="text-amber-300">MongoDB Atlas / Mongoose Engine Active</strong>
              )}
            </span>
          </div>
          <span>•</span>
          <span>SMTP 2FA Active</span>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setActiveTab('portal')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-lg bg-red-600 flex items-center justify-center text-white shadow group-hover:bg-red-500 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-lg tracking-tight flex items-center gap-1.5">
                <span>Rescue<span className="text-red-500">Grid</span></span>
                <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/30">
                  CAMPUS OPS
                </span>
                {systemStatus?.smtp?.isConfigured ? (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30 hidden sm:flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Gmail SMTP Active
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-semibold px-1.5 py-0.5 rounded border border-amber-500/30 hidden sm:flex items-center gap-1">
                    SMTP Pending
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 -mt-0.5">Real-Time Emergency Dispatch</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs — role-locked */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Student: only Student Portal */}
          {normalizedRole === 'student' && (
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'portal' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Student Portal
            </button>
          )}

          {/* Responder: only Responder Portal */}
          {normalizedRole === 'responder' && (
            <button
              onClick={() => setActiveTab('responder')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'responder' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Responder Portal
            </button>
          )}

          {/* Admin: only Command Center */}
          {normalizedRole === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'admin' ? 'bg-red-950 text-red-300 border border-red-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Command Center
            </button>
          )}

          {/* Common tabs for all logged-in users */}
          {currentUser && (
            <>
              <button
                onClick={() => setActiveTab('engine')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'engine' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 text-blue-400" />
                Scoring Engine
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'docs' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Atlas Architecture
              </button>
            </>
          )}
        </nav>


        {/* Right CTA & Authentication Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenReportModal}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-md shadow-red-900/40 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>REPORT EMERGENCY</span>
          </button>

          {/* User Status / Auth Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-left hidden sm:block">
                <div className="font-bold text-white leading-tight">
                  {currentUser.name || currentUser.fullName}
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Role: <span className="text-amber-400">{normalizedRole}</span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Log out"
                className="ml-1 text-slate-400 hover:text-red-400 p-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenAuthModal('login')}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs px-3 py-2 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => onOpenAuthModal('signup')}
                className="bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs px-3 py-2 rounded-lg hidden sm:block cursor-pointer"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
