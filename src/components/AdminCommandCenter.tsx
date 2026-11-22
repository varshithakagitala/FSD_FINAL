import React, { useState } from 'react';
import { Incident, ResponderProfile, AuditLog } from '../types';
import { rankResponders } from '../utils/engine';
import { Shield, AlertTriangle, UserCheck, Activity, Users, FileText, Send, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AdminCommandCenterProps {
  incidents: Incident[];
  responders: ResponderProfile[];
  auditLogs: AuditLog[];
  onAssignResponder: (incidentId: any, responderId: any) => void;
  onOverridePriority: (incidentId: any, newPriority: Incident['priority']) => void;
  onSelectIncident: (incident: Incident) => void;
}

export const AdminCommandCenter: React.FC<AdminCommandCenterProps> = ({
  incidents,
  responders,
  auditLogs,
  onAssignResponder,
  onOverridePriority,
  onSelectIncident,
}) => {
  const [dispatchModalIncident, setDispatchModalIncident] = useState<Incident | null>(null);

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter(i => i.priority === 'Critical' && i.status !== 'Resolved').length;
  const openCount = incidents.filter(i => i.status !== 'Resolved').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;

  const rankedCandidates = dispatchModalIncident 
    ? rankResponders(responders, dispatchModalIncident) 
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-700 text-white rounded-xl p-6 shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-red-600/30 text-red-400 font-bold px-2 py-0.5 rounded border border-red-500/40">
              CAMPUS SAFETY INCIDENT COMMAND
            </span>
            <span className="text-xs text-slate-400">Master Authority Oversight</span>
          </div>
          <h1 className="text-2xl font-black text-white">Emergency Operations Center (EOC)</h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Real-time incident dispatch, algorithmic responder ranking, priority overrides, and compliance audit logging.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Connected Storage</span>
            <span className="font-mono text-emerald-400 font-bold">MySQL 8.0 Connected</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Logged</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalIncidents}</div>
          <div className="text-xs text-slate-400 mt-0.5">Database audit count</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-red-600">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Critical Emergencies</div>
          <div className="text-2xl font-black text-red-600 mt-1">{criticalCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Life-safety priority</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Active In Progress</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{openCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Dispatched or on scene</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-600">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">Resolved Calls</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{resolvedCount}</div>
          <div className="text-xs text-slate-400 mt-0.5">Successfully contained</div>
        </div>
      </div>

      {/* Master Incident Command Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-600" />
              <span>Campus Incident Dispatch Roster</span>
            </h3>
            <p className="text-xs text-slate-500">Assign responders, adjust priority, and monitor response time</p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded">
            {incidents.length} Emergencies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/75 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Incident Title & Category</th>
                <th className="py-3 px-4">Priority (Override)</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Unit</th>
                <th className="py-3 px-4 text-right">Dispatch & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {incidents.map((inc) => (
                <tr key={inc.incidentId} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {inc.incidentCode}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{inc.title}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="font-semibold text-slate-700">{inc.category}</span>
                      <span>•</span>
                      <span>Reporter: {inc.reporterName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] uppercase border ${
                        inc.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-300' :
                        inc.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-300' :
                        'bg-amber-50 text-amber-700 border-amber-300'
                      }`}>
                        {inc.priority}
                      </span>
                      
                      {/* Priority Override selector */}
                      <select
                        value={inc.priority}
                        onChange={(e) => onOverridePriority(inc.incidentId, e.target.value as any)}
                        className="text-[11px] bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded px-1.5 py-0.5 font-medium cursor-pointer"
                        title="Override Severity Priority"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-800">{inc.campusLocation}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      GPS: {inc.latitude}, {inc.longitude}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                      {inc.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {inc.assignedResponderName ? (
                      <div className="font-medium text-slate-900">
                        {inc.assignedResponderName}
                        <span className="text-[11px] text-slate-500 block font-mono">
                          {inc.assignedResponderBadge}
                        </span>
                      </div>
                    ) : (
                      <span className="text-red-600 font-bold text-xs">UNASSIGNED</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    <button
                      onClick={() => setDispatchModalIncident(inc)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1.5 rounded text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-red-400" />
                      <span>{inc.assignedResponderId ? 'Reassign' : 'Auto-Dispatch'}</span>
                    </button>

                    <button
                      onClick={() => onSelectIncident(inc)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1.5 rounded text-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Algorithmic Responder Dispatch Modal */}
      {dispatchModalIncident && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-slate-900 text-white px-5 py-4 flex justify-between items-center border-b border-red-600">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  <span>Algorithmic Responder Dispatch Engine</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Target: {dispatchModalIncident.incidentCode} • Category: {dispatchModalIncident.category}
                </p>
              </div>
              <button
                onClick={() => setDispatchModalIncident(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
                <strong>Ranking Formula:</strong> Skill Match (0-40 pts) + Availability (0-30 pts) + Haversine Proximity (5-20 pts) - Workload Penalty (10 pts per active assignment). Highest scoring responder is recommended automatically.
              </div>

              <div className="space-y-2.5">
                {rankedCandidates.map((cand, idx) => (
                  <div
                    key={cand.userId}
                    className={`p-3.5 rounded-lg border flex flex-wrap justify-between items-center gap-3 ${
                      idx === 0
                        ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        {idx === 0 && (
                          <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 rounded">
                            RECOMMENDED #1
                          </span>
                        )}
                        <h4 className="font-bold text-slate-900">{cand.fullName}</h4>
                        <span className="font-mono text-xs text-slate-500">({cand.badgeNumber})</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-2">
                        <span>Unit: <strong>{cand.specialization}</strong></span>
                        <span>•</span>
                        <span>Distance: <strong>{cand.distanceKm} km</strong></span>
                        <span>•</span>
                        <span>Status: <strong className="text-slate-800">{cand.currentStatus}</strong></span>
                        <span>•</span>
                        <span>Active Calls: <strong>{cand.activeIncidentsCount}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Match Score</div>
                        <div className="text-lg font-black text-slate-900">{cand.matchScore} pts</div>
                      </div>

                      <button
                        onClick={() => {
                          onAssignResponder(dispatchModalIncident.incidentId, cand.userId);
                          setDispatchModalIncident(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs cursor-pointer shadow-xs ${
                          idx === 0
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        Dispatch Unit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Responder Fleet & Audit Ledger Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Responder Fleet */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 mb-1 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Campus First Responder Roster</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Readiness status and base duty zones</p>

          <div className="space-y-3">
            {responders.map((r) => (
              <div key={r.profileId} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50 text-xs">
                <div>
                  <div className="font-bold text-slate-900">{r.fullName}</div>
                  <div className="text-slate-500 text-[11px]">{r.specialization} • Base: {r.campusBaseZone}</div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                    r.currentStatus === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {r.currentStatus}
                  </span>
                  <div className="text-[11px] text-slate-400 mt-0.5">{r.activeIncidentsCount} Active Calls</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security Audit Ledger */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-extrabold text-base text-slate-900 mb-1 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Immutable Security Audit Ledger</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">Administrative actions and dispatcher audit trail</p>

          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {auditLogs.map((log) => (
              <div key={log.logId} className="p-2.5 rounded border border-slate-100 bg-slate-50 font-mono text-[11px]">
                <div className="flex justify-between items-center text-slate-900 font-bold">
                  <span>{log.actionType}</span>
                  <span className="text-slate-400 text-[10px]">{log.createdAt}</span>
                </div>
                <div className="text-slate-600 mt-1">
                  Actor: <strong>{log.userName}</strong> • IP: {log.ipAddress}
                </div>
                <div className="text-slate-500 text-[10px] truncate mt-0.5">
                  Payload: {log.detailsJson}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
