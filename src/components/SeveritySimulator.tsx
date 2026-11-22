import React, { useState } from 'react';
import { calculateSuggestedPriority, calculateHaversineDistance } from '../utils/engine';
import { Calculator, Shield, MapPin, Zap, Info } from 'lucide-react';

export const SeveritySimulator: React.FC = () => {
  const [simCategory, setSimCategory] = useState<'Medical' | 'Fire' | 'Security' | 'Accident' | 'Electrical' | 'Infrastructure' | 'Other'>('Fire');
  const [simTitle, setSimTitle] = useState('Solvent chemical fire with dense fumes');
  const [simDescription, setSimDescription] = useState('Flames visible in storage cabinet. Two students have collapsed unconscious.');
  
  // Responder calculation test
  const [candSpecialization, setCandSpecialization] = useState<'Medical' | 'Fire' | 'Security' | 'Electrical' | 'General'>('Fire');
  const [candStatus, setCandStatus] = useState<'Available' | 'Dispatched' | 'Busy' | 'Off Duty'>('Available');
  const [candWorkload, setCandWorkload] = useState(1);
  const [candDistanceKm, setCandDistanceKm] = useState(0.4);

  // Calculation details
  let baseScore = 30;
  switch (simCategory) {
    case 'Fire': baseScore = 85; break;
    case 'Medical': baseScore = 80; break;
    case 'Electrical': baseScore = 70; break;
    case 'Security': baseScore = 65; break;
    case 'Accident': baseScore = 60; break;
    case 'Infrastructure': baseScore = 40; break;
    default: baseScore = 30; break;
  }

  const combined = `${simTitle} ${simDescription}`.toLowerCase();
  const criticalKeywords = ['unconscious', 'collapse', 'cardiac', 'explosion', 'flame', 'fire', 'smoke', 'weapon', 'gun', 'knife', 'bleeding', 'trapped'];
  const severeKeywords = ['severe', 'fumes', 'chemical', 'shock', 'electric', 'leak', 'flood', 'injury'];

  const matchedCritical = criticalKeywords.filter(k => combined.includes(k));
  const matchedSevere = severeKeywords.filter(k => combined.includes(k));

  const criticalBonus = matchedCritical.length > 0 ? 20 : 0;
  const severeBonus = matchedSevere.length > 0 ? 15 : 0;
  const totalSeverityScore = baseScore + criticalBonus + severeBonus;

  const resultPriority = calculateSuggestedPriority(simCategory, simDescription, simTitle);

  // Responder ranking score calculation
  let specScore = 10;
  if (candSpecialization.toLowerCase() === simCategory.toLowerCase()) specScore = 40;
  else if (candSpecialization === 'General' || (candSpecialization === 'Security' && simCategory === 'Accident')) specScore = 20;

  let availScore = 0;
  if (candStatus === 'Available') availScore = 30;
  else if (candStatus === 'Dispatched') availScore = 10;
  else if (candStatus === 'Busy') availScore = 5;
  else availScore = -30;

  let distScore = 5;
  if (candDistanceKm < 0.3) distScore = 20;
  else if (candDistanceKm < 0.8) distScore = 15;
  else if (candDistanceKm < 1.5) distScore = 10;

  const workloadPenalty = candWorkload * 10;
  const totalResponderScore = Math.max(0, specScore + availScore + distScore - workloadPenalty);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-700 text-white rounded-xl p-6 shadow-md">
        <div className="flex items-center gap-2 mb-1">
          <Calculator className="w-4 h-4 text-blue-400" />
          <span className="text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-500/30">
            DETERMINISTIC HEURISTIC LAB
          </span>
        </div>
        <h1 className="text-2xl font-black">Severity & Dispatch Scoring Engine</h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
          RescueGrid uses a rule-based algorithm for incident severity assessment and multi-criteria responder ranking. No opaque black-box AI is claimed; all logic is deterministic, auditable, and documented.
        </p>
      </div>

      {/* Two Column Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Module 1: Severity Engine */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">1. Incident Severity Rule Engine</h2>
              <p className="text-xs text-slate-500">Evaluates base category weight + keyword heuristic modifiers</p>
            </div>
            <span className={`px-3 py-1 rounded-full font-black text-xs uppercase tracking-wide border ${
              resultPriority === 'Critical' ? 'bg-red-50 text-red-700 border-red-300 animate-pulse' :
              resultPriority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-300' :
              resultPriority === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-300' :
              'bg-slate-50 text-slate-700 border-slate-300'
            }`}>
              {resultPriority} Priority ({totalSeverityScore} pts)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Category & Base Weight:</label>
              <select
                value={simCategory}
                onChange={(e) => setSimCategory(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="Fire">Fire Hazard (Base: 85 pts)</option>
                <option value="Medical">Medical Emergency (Base: 80 pts)</option>
                <option value="Electrical">Electrical / Shock (Base: 70 pts)</option>
                <option value="Security">Security Threat (Base: 65 pts)</option>
                <option value="Accident">Accident / Collision (Base: 60 pts)</option>
                <option value="Infrastructure">Infrastructure Fault (Base: 40 pts)</option>
                <option value="Other">Other / General (Base: 30 pts)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Incident Title:</label>
              <input
                type="text"
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Incident Description:</label>
              <textarea
                rows={3}
                value={simDescription}
                onChange={(e) => setSimDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Live Scoring Breakdown Box */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">Mathematical Breakdown:</div>
              <div className="flex justify-between">
                <span>Base Category Weight ({simCategory}):</span>
                <span className="font-mono font-bold">+{baseScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Urgency Trigger (+20 pts):</span>
                <span className="font-mono font-bold text-red-600">
                  {criticalBonus > 0 ? `+20 pts (${matchedCritical.join(', ')})` : '0 pts'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Secondary Severity Trigger (+15 pts):</span>
                <span className="font-mono font-bold text-orange-600">
                  {severeBonus > 0 ? `+15 pts (${matchedSevere.join(', ')})` : '0 pts'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                <span>Total Severity Score:</span>
                <span className="font-mono text-sm">{totalSeverityScore} pts &rarr; {resultPriority}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Responder Ranking Engine */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">2. Responder Ranking Engine</h2>
              <p className="text-xs text-slate-500">Evaluates skill match, status, Haversine proximity & workload</p>
            </div>
            <span className="bg-blue-50 text-blue-800 border border-blue-300 px-3 py-1 rounded-full font-black text-xs">
              Score: {totalResponderScore} pts
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Unit Specialization:</label>
                <select
                  value={candSpecialization}
                  onChange={(e) => setCandSpecialization(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Fire">Fire Unit</option>
                  <option value="Medical">Medical Unit</option>
                  <option value="Security">Security Division</option>
                  <option value="Electrical">Electrical Team</option>
                  <option value="General">General Safety</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Current Duty Status:</label>
                <select
                  value={candStatus}
                  onChange={(e) => setCandStatus(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Available">Available (+30 pts)</option>
                  <option value="Dispatched">Dispatched (+10 pts)</option>
                  <option value="Busy">Busy (+5 pts)</option>
                  <option value="Off Duty">Off Duty (-30 pts)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-800 block mb-1">Distance (km from Pin):</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="5.0"
                  value={candDistanceKm}
                  onChange={(e) => setCandDistanceKm(parseFloat(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Active Incident Workload:</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={candWorkload}
                  onChange={(e) => setCandWorkload(parseInt(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Formula box */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900 border-b border-slate-200 pb-1">Scoring Factors:</div>
              <div className="flex justify-between">
                <span>Specialization Match ({candSpecialization} vs {simCategory}):</span>
                <span className="font-mono font-bold">+{specScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Availability Status ({candStatus}):</span>
                <span className="font-mono font-bold">+{availScore} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Haversine Proximity ({candDistanceKm} km):</span>
                <span className="font-mono font-bold">+{distScore} pts</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Workload Penalty ({candWorkload} active × -10):</span>
                <span className="font-mono font-bold">-{workloadPenalty} pts</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold text-slate-900">
                <span>Total Candidate Match Score:</span>
                <span className="font-mono text-sm">{totalResponderScore} pts</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
