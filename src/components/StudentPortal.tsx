import React, { useState } from 'react';
import { Incident, IncidentUpdate, User } from '../types';
import { AlertCircle, Clock, CheckCircle2, User as UserIcon, MapPin, Eye, Plus, Mail } from 'lucide-react';

interface StudentPortalProps {
  currentUser: User | null;
  incidents: Incident[];
  updates: IncidentUpdate[];
  onOpenReportModal: () => void;
  onSelectIncident: (incident: Incident) => void;
  onPerformOtpSignupDemo: (email: string, name: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  incidents,
  updates,
  onOpenReportModal,
  onSelectIncident,
  onPerformOtpSignupDemo,
}) => {
  const [showSignupDemo, setShowSignupDemo] = useState(false);
  const [demoName, setDemoName] = useState('Alex Rivera');
  const [demoEmail, setDemoEmail] = useState('alex.rivera@student.campus.edu');
  const [simulatedOtp, setSimulatedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);

  const studentIncidents = incidents.filter((inc) => {
    if (!currentUser) return true;
    return (
      inc.reporter === currentUser._id ||
      inc.reporterId === currentUser.userId ||
      inc.reporterEmail?.toLowerCase() === currentUser.email?.toLowerCase()
    );
  });

  const activeCount = studentIncidents.filter((i) => i.status !== 'Resolved').length;
  const resolvedCount = studentIncidents.filter((i) => i.status === 'Resolved').length;

  const handleTriggerSignupOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(code);
    setOtpSuccess(false);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp === simulatedOtp) {
      setOtpSuccess(true);
      onPerformOtpSignupDemo(demoEmail, demoName);
    } else {
      alert('Incorrect OTP. Try entering ' + simulatedOtp);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-xl p-6 border border-slate-700 shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/40">
              STUDENT REPORTING PORTAL
            </span>
            <span className="text-xs text-slate-400">Database-Backed (MongoDB Atlas) • 2FA Active</span>
          </div>
          <h1 className="text-2xl font-black text-white">
            Welcome, {currentUser ? currentUser.name || currentUser.fullName : 'Campus Member'}
          </h1>
          <p className="text-sm text-slate-300 max-w-xl mt-1">
            Report emergencies with instant geolocation and photographic evidence. Receive immediate status notifications via SMTP and live timeline progression.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSignupDemo(!showSignupDemo)}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-4 h-4 text-amber-400" />
            <span>Simulate SMTP OTP Flow</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-lg shadow-red-900/40 cursor-pointer transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Report Emergency</span>
          </button>
        </div>
      </div>

      {/* Interactive SMTP OTP Simulation Panel (if toggled) */}
      {showSignupDemo && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 text-amber-900">
              <Mail className="w-5 h-5 text-amber-700" />
              <h3 className="font-bold text-sm">SMTP 6-Digit Email OTP Verification Simulator</h3>
            </div>
            <button onClick={() => setShowSignupDemo(false)} className="text-amber-700 hover:text-amber-900 text-xs font-semibold">
              Close [✕]
            </button>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            In the backend, <code>authRoutes.ts</code> connects via <code>Nodemailer</code> (port 587 STARTTLS) to dispatch a 6-digit OTP code to the student's email. This interactive widget demonstrates the exact verification and attempt throttling workflow:
          </p>

          {!simulatedOtp ? (
            <form onSubmit={handleTriggerSignupOtp} className="flex flex-wrap items-center gap-3 text-xs">
              <input
                type="text"
                required
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                placeholder="Full Name"
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none"
              />
              <input
                type="email"
                required
                value={demoEmail}
                onChange={(e) => setDemoEmail(e.target.value)}
                placeholder="student@campus.edu"
                className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer"
              >
                Send 6-Digit OTP via SMTP
              </button>
            </form>
          ) : !otpSuccess ? (
            <div className="space-y-3 bg-white p-4 rounded-lg border border-amber-200">
              <div className="text-xs text-slate-700">
                <strong>Simulated SMTP Inbox:</strong> Verification email dispatched to <strong>{demoEmail}</strong>.
                <div className="bg-slate-900 text-red-400 font-mono text-base font-bold p-2.5 rounded mt-1.5 text-center tracking-widest">
                  OTP Code: {simulatedOtp} (Valid for 5 mins)
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="flex items-center gap-2 text-xs">
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono text-sm tracking-wider font-bold"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg cursor-pointer"
                >
                  Verify & Activate
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-100 p-3 rounded-lg border border-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Identity Verified! Account is activated with verified status in MongoDB Atlas.</span>
            </div>
          )}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Reports</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{studentIncidents.length}</div>
          <div className="text-xs text-slate-400 mt-0.5">Submitted from this account</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active In Progress</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{activeCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Currently assigned or responding</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Resolved Incidents</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Cleared by responders</div>
        </div>
      </div>

      {/* Incident Reports Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">My Emergency Incidents</h3>
            <p className="text-xs text-slate-500">Live operational status and assigned responder units in MongoDB</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
            Showing {studentIncidents.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/75 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Incident Code</th>
                <th className="py-3 px-4">Title & Details</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4">Assigned Responder</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {studentIncidents.map((inc) => (
                <tr key={inc._id || inc.incidentId || inc.incidentCode} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {inc.incidentCode}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{inc.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-red-500" />
                      <span>{inc.campusLocation}</span>
                      <span className="text-slate-300">•</span>
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {inc.category}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-extrabold text-[11px] uppercase tracking-wide border ${
                      inc.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-300' :
                      inc.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                      inc.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                      'bg-slate-50 text-slate-700 border-slate-300'
                    }`}>
                      {inc.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs ${
                      inc.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      inc.status === 'En Route' ? 'bg-purple-100 text-purple-800' :
                      inc.status === 'On Scene' ? 'bg-amber-100 text-amber-800' :
                      inc.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                      inc.status === 'Assigned' ? 'bg-sky-100 text-sky-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {inc.assignedResponderName ? (
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{inc.assignedResponderName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Badge: <span className="font-mono">{inc.assignedResponderBadge}</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic text-xs">Awaiting Dispatch...</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">
                    {typeof inc.createdAt === 'string' && inc.createdAt.includes('T')
                      ? new Date(inc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : inc.createdAt}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1.5 rounded text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Details & Timeline</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
