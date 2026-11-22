import React, { useEffect, useRef } from 'react';
import { Incident, IncidentUpdate } from '../types';
import { X, MapPin, Clock, Shield, User, Phone, CheckCircle2 } from 'lucide-react';
import L from 'leaflet';

interface IncidentDetailModalProps {
  incident: Incident | null;
  updates: IncidentUpdate[];
  onClose: () => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  updates,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const incidentUpdates = incident 
    ? updates.filter(u => u.incidentId === incident.incidentId) 
    : [];

  useEffect(() => {
    if (!incident) return;

    const timer = setTimeout(() => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        const lat = incident.latitude ?? 37.7749;
        const lng = incident.longitude ?? -122.4194;
        const map = L.map(mapContainerRef.current).setView([lat, lng], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(map);

        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        L.marker([lat, lng], { icon: customIcon })
          .addTo(map)
          .bindPopup(`<b>${incident.incidentCode}</b><br>${incident.campusLocation}`)
          .openPopup();

        mapInstanceRef.current = map;
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [incident]);

  if (!incident) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center border-b border-red-600">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-red-600 text-white px-2 py-0.5 rounded">
              {incident.incidentCode}
            </span>
            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
              incident.priority === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
              incident.priority === 'High' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' :
              'bg-amber-500/20 text-amber-400 border-amber-500/40'
            }`}>
              {incident.priority} Priority
            </span>
            <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded">
              {incident.status}
            </span>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{incident.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-red-600" />
              <span>{incident.campusLocation}</span>
              <span>•</span>
              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                {incident.category}
              </span>
            </div>
          </div>

          {/* Map & Coordinates */}
          <div>
            <div ref={mapContainerRef} className="w-full h-36 rounded-lg border border-slate-300 overflow-hidden" />
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              GPS Coordinates: {incident.latitude}, {incident.longitude}
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-xs font-bold text-slate-500 uppercase mb-1">Incident Report Description:</div>
            <p className="text-slate-800 text-xs leading-relaxed">{incident.description}</p>
          </div>

          {/* Responder Assignment */}
          <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 flex justify-between items-center">
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase">Assigned Field Unit</div>
              <div className="font-bold text-slate-900 mt-0.5">
                {incident.assignedResponderName || 'Awaiting Command Dispatch'}
              </div>
              {incident.assignedResponderBadge && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Badge: {incident.assignedResponderBadge}
                </div>
              )}
            </div>
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>

          {/* Chronological Event Timeline */}
          <div>
            <div className="font-bold text-xs uppercase text-slate-700 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Response Progression Timeline</span>
            </div>

            <div className="border-l-2 border-slate-200 ml-2 pl-3 space-y-3">
              {incidentUpdates.length === 0 ? (
                <div className="text-xs text-slate-400 italic">Report received and queued for dispatch.</div>
              ) : (
                incidentUpdates.map((u) => (
                  <div key={u.updateId} className="relative">
                    <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white" />
                    <div className="flex justify-between items-baseline text-xs">
                      <strong className="text-slate-900">{u.statusAfter}</strong>
                      <span className="text-[11px] text-slate-400">{u.createdAt}</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">{u.noteText}</div>
                    <div className="text-[10px] text-slate-400">By {u.updaterName} ({u.updaterRole})</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
