import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StudentPortal } from './components/StudentPortal';
import { ResponderPortal } from './components/ResponderPortal';
import { AdminCommandCenter } from './components/AdminCommandCenter';
import { SeveritySimulator } from './components/SeveritySimulator';
import { ProjectDocsExplorer } from './components/ProjectDocsExplorer';
import { ReportEmergencyModal } from './components/ReportEmergencyModal';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { AuthModal } from './components/AuthModal';
import { INITIAL_INCIDENTS, INITIAL_RESPONDERS, INITIAL_UPDATES, INITIAL_AUDIT_LOGS } from './mockData';
import { User, Incident, IncidentUpdate, ResponderProfile, AuditLog, SystemStatus } from './types';
import { api, setStoredToken } from './services/api';
import { AlertTriangle, ShieldCheck, Database, RefreshCw, ExternalLink, Server, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'portal' | 'report' | 'admin' | 'responder' | 'engine' | 'docs'>('portal');
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [responders, setResponders] = useState<ResponderProfile[]>(INITIAL_RESPONDERS);
  const [updates, setUpdates] = useState<IncidentUpdate[]>(INITIAL_UPDATES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTestingAtlas, setIsTestingAtlas] = useState(false);
  const [hasCopiedIp, setHasCopiedIp] = useState(false);
  const [isAtlasBannerCollapsed, setIsAtlasBannerCollapsed] = useState(false);


  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRetryAtlas = async () => {
    setIsTestingAtlas(true);
    try {
      const res = await api.retryAtlas();
      if (res.success) {
        showToast('Successfully connected to MongoDB Atlas live cluster!');
        fetchBackendData();
      } else {
        showToast(res.error || 'Connection failed: Whitelist 0.0.0.0/0 in Atlas');
      }
    } catch (err: any) {
      showToast(err.message || 'Atlas cluster is awaiting IP whitelist (0.0.0.0/0)');
    } finally {
      setIsTestingAtlas(false);
    }
  };

  // Fetch system status and active incidents from MongoDB backend
  const fetchBackendData = useCallback(async () => {
    try {
      setIsSyncing(true);
      // 1. Fetch system & database status
      const statusRes = await api.getStatus();
      if (statusRes.success) {
        setSystemStatus({
          database: statusRes.database,
          smtp: statusRes.smtp,
        });
      }

      // 2. Fetch authenticated user profile if token exists
      try {
        const meRes = await api.getMe();
        if (meRes.success && meRes.user) {
          setCurrentUser(meRes.user);
        }
      } catch {
        // Not logged in or token expired; keep initial state
      }

      // 3. Fetch incidents from MongoDB
      try {
        const incRes = await api.getIncidents();
        if (incRes.success && Array.isArray(incRes.incidents) && incRes.incidents.length > 0) {
          // Normalize mongo _id to incidentId if needed
          const mappedIncidents = incRes.incidents.map((inc: any) => ({
            ...inc,
            incidentId: inc._id || inc.incidentId,
          }));
          setIncidents(mappedIncidents);
        }
      } catch {
        // Keep fallback data if backend endpoint failed
      }

      // 4. Fetch responders if user is admin
      try {
        const respRes = await api.getResponders();
        if (respRes.success && Array.isArray(respRes.responders) && respRes.responders.length > 0) {
          const mappedResponders = respRes.responders.map((r: any) => ({
            ...r,
            profileId: r._id || r.profileId,
            userId: r.user?._id || r.user || r.userId,
            fullName: r.fullName || r.user?.name,
          }));
          setResponders(mappedResponders);
        }
      } catch {
        // Keep default responders
      }

      // 5. Fetch audit logs if available
      try {
        const logsRes = await api.getAuditLogs(30);
        if (logsRes.success && Array.isArray(logsRes.logs) && logsRes.logs.length > 0) {
          setAuditLogs(logsRes.logs);
        }
      } catch {
        // Keep initial audit logs
      }
    } catch (err: any) {
      console.warn('[RescueGrid] Backend sync notice:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendData();
  }, [fetchBackendData]);

  const handleLogout = async () => {
    try { await api.logout(); } catch { /* ignore */ }
    setStoredToken(null);
    setCurrentUser(null);
    setActiveTab('portal');
    showToast('Logged out successfully.');
  };

  // Submit Emergency Report to MongoDB
  const handleSubmitIncident = async (partial: Partial<Incident>) => {
    const fallbackId = incidents.length + 1;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const code = `INC-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const newIncident: Incident = {
      incidentId: fallbackId,
      incidentCode: code,
      reporterId: currentUser?._id || currentUser?.userId || 6,
      reporterName: currentUser?.fullName || currentUser?.name || 'Anonymous Student',
      reporterEmail: currentUser?.email || 'student@campus.edu',
      title: partial.title || 'Campus Emergency',
      category: partial.category || 'Other',
      priority: partial.priority || 'Medium',
      calculatedPriority: partial.calculatedPriority || 'Medium',
      status: 'Reported',
      campusLocation: partial.campusLocation || 'Campus Quad',
      latitude: partial.latitude ?? 37.7749,
      longitude: partial.longitude ?? -122.4194,
      description: partial.description || '',
      contactNumber: partial.contactNumber || '+1 (555) 019-9111',
      photoUrl: partial.photoUrl,
      createdAt: 'Just now',
    };

    // Try creating via real backend MongoDB
    try {
      const res = await api.createIncident({
        title: newIncident.title,
        description: newIncident.description,
        category: newIncident.category,
        campusLocation: newIncident.campusLocation,
        latitude: newIncident.latitude,
        longitude: newIncident.longitude,
        contactNumber: newIncident.contactNumber,
        photoUrl: newIncident.photoUrl,
      });

      if (res.success && res.incident) {
        const savedInc: Incident = {
          ...res.incident,
          incidentId: res.incident._id,
        };
        setIncidents(prev => [savedInc, ...prev]);
        showToast(`Emergency ${savedInc.incidentCode} recorded in MongoDB Atlas & dispatched!`);
        fetchBackendData();
        return;
      }
    } catch (err: any) {
      console.warn('[RescueGrid] API report creation notice:', err.message);
    }

    // Client optimistic fallback
    setIncidents(prev => [newIncident, ...prev]);

    const initialUpdate: IncidentUpdate = {
      updateId: updates.length + 1,
      incidentId: fallbackId,
      updatedByUserId: currentUser?._id || currentUser?.userId || 6,
      updaterName: currentUser?.fullName || currentUser?.name || 'Reporter',
      updaterRole: currentUser?.role || 'STUDENT',
      statusBefore: 'None',
      statusAfter: 'Reported',
      noteText: `Emergency reported. Severity assessed as ${newIncident.priority}.`,
      createdAt: 'Just now',
    };
    setUpdates(prev => [initialUpdate, ...prev]);

    showToast(`Emergency ${code} logged successfully! Notified Command Center.`);
  };

  // Dispatch / Assign Responder
  const handleAssignResponder = async (incidentId: any, responderId: any) => {
    const responder = responders.find(r => r.userId === responderId || r._id === responderId || r.profileId === responderId);
    
    // Try backend API assignment
    try {
      const res = await api.assignResponder(incidentId, responder?.userId || responderId, 'Dispatched by Operations Command');
      if (res.success) {
        showToast(`Dispatched ${responder?.fullName || 'Responder'} via MongoDB!`);
        fetchBackendData();
        return;
      }
    } catch (err: any) {
      console.warn('[RescueGrid] Assignment API notice:', err.message);
    }

    // Client fallback
    setIncidents(prev => prev.map(inc => {
      if (inc.incidentId === incidentId || inc._id === incidentId) {
        return {
          ...inc,
          status: 'Assigned',
          assignedResponderId: responder?.userId || responderId,
          assignedResponderName: responder?.fullName || 'Assigned Officer',
          assignedResponderBadge: responder?.badgeNumber || 'RESP-01',
        };
      }
      return inc;
    }));

    if (responder) {
      setResponders(prev => prev.map(r => {
        if (r.userId === responderId || r._id === responderId) {
          return { ...r, activeIncidentsCount: r.activeIncidentsCount + 1, currentStatus: 'Busy' };
        }
        return r;
      }));
    }

    const updateEntry: IncidentUpdate = {
      updateId: updates.length + 1,
      incidentId,
      updatedByUserId: currentUser?._id || currentUser?.userId || 1,
      updaterName: currentUser?.fullName || currentUser?.name || 'Command Admin',
      updaterRole: 'ADMIN',
      statusBefore: 'Reported',
      statusAfter: 'Assigned',
      noteText: `Assigned to ${responder?.fullName || 'Responder'} (${responder?.badgeNumber || 'ID'}) by Operations Command.`,
      createdAt: 'Just now',
    };
    setUpdates(prev => [updateEntry, ...prev]);

    showToast(`Dispatched responder to incident!`);
  };

  // Override Priority (Admin)
  const handleOverridePriority = async (incidentId: any, newPriority: Incident['priority']) => {
    try {
      const res = await api.overridePriority(incidentId, newPriority);
      if (res.success) {
        showToast(`Priority overridden to ${newPriority} in MongoDB!`);
        fetchBackendData();
        return;
      }
    } catch (err: any) {
      console.warn('[RescueGrid] Priority override API notice:', err.message);
    }

    setIncidents(prev => prev.map(inc => {
      if (inc.incidentId === incidentId || inc._id === incidentId) {
        return { ...inc, priority: newPriority };
      }
      return inc;
    }));

    const updateEntry: IncidentUpdate = {
      updateId: updates.length + 1,
      incidentId,
      updatedByUserId: currentUser?._id || currentUser?.userId || 1,
      updaterName: currentUser?.fullName || currentUser?.name || 'Command Admin',
      updaterRole: 'ADMIN',
      statusBefore: 'Previous',
      statusAfter: newPriority,
      noteText: `Priority overridden to ${newPriority} by Command Center.`,
      createdAt: 'Just now',
    };
    setUpdates(prev => [updateEntry, ...prev]);

    showToast(`Incident priority updated to ${newPriority}.`);
  };

  // Update Status (Responder / Admin)
  const handleUpdateStatus = async (incidentId: any, newStatus: Incident['status'], noteText: string) => {
    try {
      const res = await api.updateStatus(incidentId, newStatus, noteText);
      if (res.success) {
        showToast(`Status updated to ${newStatus}. Student notified via SMTP!`);
        fetchBackendData();
        return;
      }
    } catch (err: any) {
      console.warn('[RescueGrid] Update status API notice:', err.message);
    }

    setIncidents(prev => prev.map(inc => {
      if (inc.incidentId === incidentId || inc._id === incidentId) {
        return {
          ...inc,
          status: newStatus,
          resolvedAt: newStatus === 'Resolved' ? 'Just now' : inc.resolvedAt,
        };
      }
      return inc;
    }));

    if (newStatus === 'Resolved') {
      const targetInc = incidents.find(i => i.incidentId === incidentId || i._id === incidentId);
      if (targetInc?.assignedResponderId) {
        setResponders(prev => prev.map(r => {
          if (r.userId === targetInc.assignedResponderId) {
            return {
              ...r,
              activeIncidentsCount: Math.max(0, r.activeIncidentsCount - 1),
              currentStatus: 'Available',
            };
          }
          return r;
        }));
      }
    }

    const updateEntry: IncidentUpdate = {
      updateId: updates.length + 1,
      incidentId,
      updatedByUserId: currentUser?._id || currentUser?.userId || 2,
      updaterName: currentUser?.fullName || currentUser?.name || 'Responder',
      updaterRole: 'RESPONDER',
      statusBefore: 'Previous',
      statusAfter: newStatus,
      noteText,
      createdAt: 'Just now',
    };
    setUpdates(prev => [updateEntry, ...prev]);

    showToast(`Status updated to ${newStatus}. Student notified via SMTP.`);
  };

  // Request Backup
  const handleRequestBackup = (incidentId: any, note: string) => {
    const updateEntry: IncidentUpdate = {
      updateId: updates.length + 1,
      incidentId,
      updatedByUserId: currentUser?._id || currentUser?.userId || 2,
      updaterName: currentUser?.fullName || currentUser?.name || 'Responder',
      updaterRole: 'RESPONDER',
      statusBefore: 'Active',
      statusAfter: 'BACKUP REQUESTED',
      noteText: `[BACKUP ALERT] ${note}`,
      createdAt: 'Just now',
    };
    setUpdates(prev => [updateEntry, ...prev]);

    showToast(`High priority backup request transmitted to Command Center!`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800 antialiased selection:bg-red-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white border border-slate-700 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenAuthModal={(mode) => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        systemStatus={systemStatus}
      />

      {/* Sync Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-1.5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <span>
            {currentUser
              ? <>Signed in as <strong className="text-white">{currentUser.name || currentUser.fullName}</strong> · <span className="text-amber-400 uppercase font-semibold">{currentUser.role}</span></>
              : <span className="text-slate-500">Not signed in — please log in to access your portal.</span>
            }
          </span>
          <button
            onClick={fetchBackendData}
            disabled={isSyncing}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            title="Refresh database state"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-red-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync MongoDB'}</span>
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {/* Atlas Network Access & Status Notification */}
        {systemStatus?.database?.ipWhitelistNeeded && (
          <div className="mb-6 bg-slate-900 border border-slate-700/80 rounded-xl overflow-hidden shadow-lg transition-all">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <span>MongoDB Atlas Cluster:</span>
                    <code className="text-emerald-400 font-mono text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                      {systemStatus.database.clusterHost || 'cluster0.j7seopa.mongodb.net'}
                    </code>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    RescueGrid Mongoose engine active. Whitelist incoming IP in Atlas to direct all records to your live cloud cluster.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAtlasBannerCollapsed(!isAtlasBannerCollapsed)}
                  className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  {isAtlasBannerCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {!isAtlasBannerCollapsed && (
              <div className="p-4 bg-slate-900/60 text-xs text-slate-300 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 1</span>
                    <p className="mt-1 font-medium text-slate-200">Open MongoDB Atlas</p>
                    <a
                      href="https://cloud.mongodb.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 mt-1 font-semibold"
                    >
                      cloud.mongodb.com <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 2</span>
                    <p className="mt-1 font-medium text-slate-200">Network Access → Add IP</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-slate-900 text-amber-300 font-mono px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                        0.0.0.0/0
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('0.0.0.0/0');
                          setHasCopiedIp(true);
                          setTimeout(() => setHasCopiedIp(false), 2000);
                        }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-[10px]"
                      >
                        {hasCopiedIp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{hasCopiedIp ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Step 3</span>
                      <p className="mt-1 font-medium text-slate-200">Confirm & Connect</p>
                    </div>
                    <button
                      onClick={handleRetryAtlas}
                      disabled={isTestingAtlas}
                      className="mt-2 w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white font-semibold rounded-md shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTestingAtlas ? 'animate-spin' : ''}`} />
                      <span>{isTestingAtlas ? 'Connecting to Atlas...' : 'Test & Connect Atlas'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Role-locked portal rendering */}
        {!currentUser ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Welcome to RescueGrid</h2>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              Sign in or create an account to access your role-specific portal. Students, Responders, and Admins each have dedicated dashboards.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setAuthModalMode('login'); setIsAuthModalOpen(true); }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-sm cursor-pointer shadow-md transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthModalMode('signup'); setIsAuthModalOpen(true); }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-sm cursor-pointer transition-all"
              >
                Create Account
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Student Portal — only for students */}
            {currentUser.role?.toLowerCase() === 'student' && (
              <StudentPortal
                currentUser={currentUser}
                incidents={incidents}
                updates={updates}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
                onPerformOtpSignupDemo={(email, name) => {
                  showToast(`Student ${name} verified and registered!`);
                }}
              />
            )}

            {/* Responder Portal — only for responders */}
            {currentUser.role?.toLowerCase() === 'responder' && (
              <ResponderPortal
                currentUser={currentUser}
                responders={responders}
                incidents={incidents}
                onUpdateStatus={handleUpdateStatus}
                onRequestBackup={handleRequestBackup}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            )}

            {/* Admin Command Center — only for admins */}
            {currentUser.role?.toLowerCase() === 'admin' && (
              <AdminCommandCenter
                incidents={incidents}
                responders={responders}
                auditLogs={auditLogs}
                onAssignResponder={handleAssignResponder}
                onOverridePriority={handleOverridePriority}
                onSelectIncident={(inc) => setSelectedIncident(inc)}
              />
            )}

            {/* Scoring Engine & Docs — accessible to all logged-in users */}
            {activeTab === 'engine' && <SeveritySimulator />}
            {activeTab === 'docs' && <ProjectDocsExplorer />}
          </>
        )}
      </main>


      {/* Emergency Reporting Modal */}
      <ReportEmergencyModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSubmitIncident={handleSubmitIncident}
      />

      {/* Incident Detail & Timeline Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        updates={updates}
        onClose={() => setSelectedIncident(null)}
      />

      {/* Authentication & OTP Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          const r = user.role?.toLowerCase();
          if (r === 'admin') setActiveTab('admin');
          else if (r === 'responder') setActiveTab('responder');
          else setActiveTab('portal');
          showToast(`Welcome back, ${user.name || user.fullName}! Authenticated with JWT.`);
          fetchBackendData();
        }}
      />

      {/* Bottom Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-5 px-6 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div>
            <strong>RescueGrid: Real-Time Campus Emergency Reporting and Response Web Application</strong>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Full Stack Development (FSD-2) Mini Project • React 19 • Node.js & Express • MongoDB Atlas with Mongoose • BCrypt & JWT 2FA • Nodemailer SMTP • Leaflet OpenStreetMap
            </p>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Node.js / Express &bull; Port 3000 &bull; MongoDB Atlas Architecture
          </div>
        </div>
      </footer>
    </div>
  );
}
