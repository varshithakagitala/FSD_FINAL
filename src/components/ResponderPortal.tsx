import React, { useState } from 'react';
import { Incident, ResponderProfile, User } from '../types';
import { Radio, MapPin, CheckCircle, Car, ShieldAlert, AlertTriangle, Eye } from 'lucide-react';

interface ResponderPortalProps {
  currentUser: User | null;
  responders: ResponderProfile[];
  incidents: Incident[];
  onUpdateStatus: (incidentId: any, newStatus: Incident['status'], noteText: string) => void;
  onRequestBackup: (incidentId: any, note: string) => void;
  onSelectIncident: (incident: Incident) => void;
}

export const ResponderPortal: React.FC<ResponderPortalProps> = ({
  currentUser,
  responders,
  incidents,
  onUpdateStatus,
  onRequestBackup,
  onSelectIncident,
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<any>(null);
  const [actionNote, setActionNote] = useState('');
  const [backupReason, setBackupReason] = useState('');
  const [showBackupModal, setShowBackupModal] = useState<any>(null);

  // Match active responder from current logged in user or first profile
  const activeResponder =
    responders.find(
      (r) =>
        currentUser &&
        (r.user === currentUser._id ||
          r.userId === currentUser.userId ||
          r.email === currentUser.email)
    ) || responders[0] || {
      fullName: 'Capt. Marcus Vance',
      badgeNumber: 'SEC-042',
      specialization: 'Security',
      campusBaseZone: 'Security Post Alpha (North Gate)',
      currentStatus: 'Available',
    };

  const assignedIncidents = incidents.filter((inc) => {
    const responderId = (activeResponder as any).user?._id || (activeResponder as any).user || (activeResponder as any).userId;
    return (
      inc.assignedResponder === responderId ||
      inc.assignedResponderId === responderId ||
      inc.assignedResponderName === activeResponder.fullName ||
      inc.status === 'Reported' ||
      inc.status === 'Assigned'
    );
  });

  const handleAction = (incidentId: any, newStatus: Incident['status']) => {
    onUpdateStatus(incidentId, newStatus, actionNote || `Status transitioned to ${newStatus}`);
    setActionNote('');
  };

  const handleBackupSubmit = (incidentId: any) => {
    onRequestBackup(incidentId, backupReason || 'Urgent hazard escalation / additional hands requested.');
    setShowBackupModal(null);
    setBackupReason('');
  };

  return (
    <div className="space-y-6">
      {/* Responder Identity Card */}
      <div className="bg-slate-900 border border-slate-700 text-white rounded-xl p-5 flex flex-wrap justify-between items-center gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black">{activeResponder.fullName}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono text-xs px-2 py-0.5 rounded font-bold">
                {activeResponder.badgeNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Unit: <strong className="text-white">{activeResponder.specialization} Division</strong></span>
              <span>•</span>
              <span>Duty Post: <strong className="text-white">{activeResponder.campusBaseZone}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">MongoDB Atlas Status</div>
            <div className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5 justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {activeResponder.currentStatus || 'Available'}
            </div>
          </div>
        </div>
      </div>

      {/* Dispatched Incidents */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Tactical Response Queue</h3>
            <p className="text-xs text-slate-500">Live emergencies assigned to your unit in database</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-md">
            {assignedIncidents.length} Calls Pending / Active
          </span>
        </div>

        <div className="divide-y divide-slate-200">
          {assignedIncidents.map((inc) => {
            const incKey = inc._id || inc.incidentId || inc.incidentCode;
            return (
              <div key={incKey} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-wrap justify-between items-start gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                        {inc.incidentCode}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                        inc.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-300' :
                        inc.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                        'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {inc.priority}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                        {inc.category}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base">{inc.title}</h4>
                    
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>{inc.campusLocation}</span>
                      {inc.latitude != null && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="font-mono text-slate-500">({inc.latitude}, {inc.longitude})</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2">
                      "{inc.description}"
                    </p>
                  </div>

                  {/* Status Indicator & Details Trigger */}
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className={`px-3 py-1 rounded-md font-bold text-xs uppercase tracking-wide ${
                      inc.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                      inc.status === 'En Route' ? 'bg-purple-100 text-purple-800' :
                      inc.status === 'On Scene' ? 'bg-amber-100 text-amber-800' :
                      inc.status === 'Accepted' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {inc.status}
                    </span>
                    
                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="text-xs text-slate-600 hover:text-slate-900 underline flex items-center gap-1 mt-1 cursor-pointer font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full Incident Timeline</span>
                    </button>
                  </div>
                </div>

                {/* Responder Action Controls */}
                {inc.status !== 'Resolved' && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {inc.status === 'Assigned' && (
                        <button
                          onClick={() => handleAction(inc._id || inc.incidentId, 'Accepted')}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Acknowledge & Accept</span>
                        </button>
                      )}

                      {inc.status === 'Accepted' && (
                        <button
                          onClick={() => handleAction(inc._id || inc.incidentId, 'En Route')}
                          className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Car className="w-3.5 h-3.5" />
                          <span>Mark En Route</span>
                        </button>
                      )}

                      {inc.status === 'En Route' && (
                        <button
                          onClick={() => handleAction(inc._id || inc.incidentId, 'On Scene')}
                          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Mark On Scene</span>
                        </button>
                      )}

                      {inc.status === 'On Scene' && (
                        <button
                          onClick={() => handleAction(inc._id || inc.incidentId, 'Resolved')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Clear & Mark Resolved</span>
                        </button>
                      )}

                      <button
                        onClick={() => setShowBackupModal(incKey)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                        <span>Request Backup</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="text"
                        placeholder="Add tactical field note..."
                        value={selectedIncidentId === incKey ? actionNote : ''}
                        onFocus={() => setSelectedIncidentId(incKey)}
                        onChange={(e) => setActionNote(e.target.value)}
                        className="text-xs px-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-slate-800 w-full sm:w-64"
                      />
                    </div>
                  </div>
                )}

                {/* Backup Request Modal */}
                {showBackupModal === incKey && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
                    <div className="font-bold text-red-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span>Confirm Emergency Backup Request to Command Center:</span>
                    </div>
                    <input
                      type="text"
                      value={backupReason}
                      onChange={(e) => setBackupReason(e.target.value)}
                      placeholder="Specify backup needed (e.g. additional extinguisher, second trauma paramedic)"
                      className="w-full px-3 py-1.5 bg-white border border-red-300 rounded text-xs focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowBackupModal(null)}
                        className="px-2.5 py-1 text-slate-600 hover:bg-red-100 rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleBackupSubmit(inc._id || inc.incidentId)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded cursor-pointer"
                      >
                        Transmit Backup Alert
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
