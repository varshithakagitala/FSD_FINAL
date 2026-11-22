import React, { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle, MapPin, Crosshair, Camera, CheckCircle2, ShieldAlert } from 'lucide-react';
import { calculateSuggestedPriority } from '../utils/engine';
import { Incident } from '../types';
import L from 'leaflet';

interface ReportEmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitIncident: (incident: Partial<Incident>) => void;
}

export const ReportEmergencyModal: React.FC<ReportEmergencyModalProps> = ({
  isOpen,
  onClose,
  onSubmitIncident,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Medical' | 'Fire' | 'Security' | 'Accident' | 'Electrical' | 'Infrastructure' | 'Other'>('Fire');
  const [campusLocation, setCampusLocation] = useState('Science & Technology Block B, Room 304');
  const [latitude, setLatitude] = useState(37.7752);
  const [longitude, setLongitude] = useState(-122.4189);
  const [description, setDescription] = useState('');
  const [contactNumber, setContactNumber] = useState('+1 (555) 019-9111');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Calculate live rule-based severity preview
  const livePriority = calculateSuggestedPriority(category, description, title);

  // Initialize or update Leaflet map when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (mapContainerRef.current && !mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([latitude, longitude], 16);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const customIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
        });

        const marker = L.marker([latitude, longitude], { draggable: true, icon: customIcon }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setLatitude(parseFloat(pos.lat.toFixed(6)));
          setLongitude(parseFloat(pos.lng.toFixed(6)));
        });

        map.on('click', (e) => {
          marker.setLatLng(e.latlng);
          setLatitude(parseFloat(e.latlng.lat.toFixed(6)));
          setLongitude(parseFloat(e.latlng.lng.toFixed(6)));
        });

        mapInstanceRef.current = map;
        markerRef.current = marker;
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen]);

  const handlePreset = (locName: string, lat: number, lon: number) => {
    setCampusLocation(locName);
    setLatitude(lat);
    setLongitude(lon);
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([lat, lon], 17);
      markerRef.current.setLatLng([lat, lon]);
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lon = parseFloat(pos.coords.longitude.toFixed(6));
        setLatitude(lat);
        setLongitude(lon);
        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setView([lat, lon], 17);
          markerRef.current.setLatLng([lat, lon]);
        }
      },
      () => {
        setIsLocating(false);
        alert('Could not access device location. Please pin your location on the map.');
      },
      { timeout: 8000 }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5 MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !campusLocation.trim() || !description.trim()) {
      alert('Please fill in all mandatory fields.');
      return;
    }

    onSubmitIncident({
      title,
      category,
      campusLocation,
      latitude,
      longitude,
      description,
      contactNumber,
      priority: livePriority,
      calculatedPriority: livePriority,
      photoUrl: photoPreview || undefined,
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex justify-between items-center border-b border-red-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center text-white">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg">Report Campus Emergency</h2>
              <p className="text-xs text-slate-400">Direct transmission to Campus Safety & First Responders</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Life Safety Warning */}
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 text-xs text-red-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>If there is active gunfire, heavy trapped flames, or cardiac arrest, call Campus Police Dispatch at <strong>(555) 019-9111</strong> or <strong>911</strong> immediately.</span>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-sm text-slate-800">
          
          {/* Title & Live Severity Indicator */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                Incident Title *
              </label>
              {/* Dynamic rule engine preview pill */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500 font-medium">Assessed Priority:</span>
                <span className={`px-2 py-0.5 rounded-full font-extrabold uppercase text-[11px] ${
                  livePriority === 'Critical' ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' :
                  livePriority === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                  livePriority === 'Medium' ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                  'bg-slate-100 text-slate-700 border border-slate-300'
                }`}>
                  {livePriority}
                </span>
              </div>
            </div>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Severe Chemical Fumes and Fire in Chem Lab 304"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 font-medium"
            />
          </div>

          {/* Category & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value="Fire">Fire & Hazard (Base 85)</option>
                <option value="Medical">Medical Emergency (Base 80)</option>
                <option value="Electrical">Electrical Fault (Base 70)</option>
                <option value="Security">Security / Threat (Base 65)</option>
                <option value="Accident">Accident / Collision (Base 60)</option>
                <option value="Infrastructure">Infrastructure / Leak (Base 40)</option>
                <option value="Other">Other Emergency (Base 30)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">
                Callback Phone Number *
              </label>
              <input
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+1 (555) 019-9111"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Campus Location */}
          <div>
            <label className="block font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">
              Campus Building / Room Location *
            </label>
            <input
              type="text"
              required
              value={campusLocation}
              onChange={(e) => setCampusLocation(e.target.value)}
              placeholder="e.g. Science Complex Block B, 3rd Floor"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs">
              <span className="text-slate-500 font-medium">Quick Presets:</span>
              <button
                type="button"
                onClick={() => handlePreset('Science Block B (Chem Lab 304)', 37.7752, -122.4189)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 cursor-pointer"
              >
                Science Block B
              </button>
              <button
                type="button"
                onClick={() => handlePreset('W.E.B. Du Bois Library (East Staircase)', 37.7761, -122.4178)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 cursor-pointer"
              >
                Main Library
              </button>
              <button
                type="button"
                onClick={() => handlePreset('Student Activity Center (Basement)', 37.7741, -122.4205)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 cursor-pointer"
              >
                Student Center
              </button>
              <button
                type="button"
                onClick={() => handlePreset('North Gate Security Post Alpha', 37.7749, -122.4194)}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-slate-700 cursor-pointer"
              >
                North Gate
              </button>
            </div>
          </div>

          {/* Leaflet Map Integration */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-red-600" />
                Interactive OpenStreetMap GPS Pin
              </label>
              <button
                type="button"
                onClick={handleUseGps}
                disabled={isLocating}
                className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-md text-slate-700 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Crosshair className="w-3 h-3 text-red-600" />
                {isLocating ? 'Detecting...' : 'Use My GPS'}
              </button>
            </div>

            <div 
              ref={mapContainerRef} 
              className="w-full h-44 rounded-lg border border-slate-300 overflow-hidden relative shadow-inner"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>Lat: {latitude}</span>
              <span>Lon: {longitude}</span>
              <span className="text-slate-400 font-sans">Drag pin or click map to relocate</span>
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">
              Emergency Description *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe injuries, hazards, flames, trapped persons, or chemical fumes..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
            <div className="text-[11px] text-slate-500 mt-0.5">
              💡 Severity engine dynamically scans for keywords: <em>unconscious, fire, flame, smoke, bleeding, chemical, fumes, leak, shock</em>.
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block font-bold text-slate-900 text-xs uppercase tracking-wide mb-1">
              Optional Photo Evidence (Max 5 MB)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer">
                <Camera className="w-4 h-4 text-slate-600" />
                Choose Image
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              {photoPreview && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Photo attached</span>
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="text-red-500 hover:underline ml-1"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer active:scale-95 transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              Transmit Emergency Report Now
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
