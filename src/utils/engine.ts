import { Incident, ResponderProfile } from '../types';

export function calculateSuggestedPriority(category: string, description: string, title: string): 'Low' | 'Medium' | 'High' | 'Critical' {
  let score = 30;
  switch (category) {
    case 'Fire': score = 85; break;
    case 'Medical': score = 80; break;
    case 'Electrical': score = 70; break;
    case 'Security': score = 65; break;
    case 'Accident': score = 60; break;
    case 'Infrastructure': score = 40; break;
    default: score = 30; break;
  }

  const combined = `${title || ''} ${description || ''}`.toLowerCase();

  const criticalKeywords = [
    'unconscious', 'collapse', 'cardiac', 'explosion', 'flame', 'fire', 'smoke',
    'weapon', 'gun', 'knife', 'active shooter', 'bleeding', 'trapped', 'burn'
  ];
  for (const kw of criticalKeywords) {
    if (combined.includes(kw)) {
      score += 20;
      break;
    }
  }

  const severeKeywords = [
    'severe', 'fumes', 'chemical', 'shock', 'electric', 'leak', 'flood', 'injury', 'fracture'
  ];
  for (const kw of severeKeywords) {
    if (combined.includes(kw)) {
      score += 15;
      break;
    }
  }

  if (score >= 85) return 'Critical';
  if (score >= 65) return 'High';
  if (score >= 45) return 'Medium';
  return 'Low';
}

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const rLat1 = lat1 * (Math.PI / 180);
  const rLat2 = lat2 * (Math.PI / 180);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rLat1) * Math.cos(rLat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(earthRadiusKm * c * 100) / 100;
}

export function rankResponders(responders: ResponderProfile[], incident: Incident): ResponderProfile[] {
  return responders.map(profile => {
    let score = 0;

    // 1. Specialization match
    if (profile.specialization.toLowerCase() === incident.category.toLowerCase()) {
      score += 40.0;
    } else if (
      profile.specialization === 'General' ||
      (profile.specialization === 'Security' && incident.category === 'Accident')
    ) {
      score += 20.0;
    } else {
      score += 10.0;
    }

    // 2. Availability
    if (profile.currentStatus === 'Available') score += 30.0;
    else if (profile.currentStatus === 'Dispatched') score += 10.0;
    else if (profile.currentStatus === 'Busy') score += 5.0;
    else score -= 30.0; // Off duty

    // 3. Proximity distance
    const plat = profile.currentLatitude ?? 37.7749;
    const plong = profile.currentLongitude ?? -122.4194;
    const ilat = incident.latitude ?? 37.7749;
    const ilong = incident.longitude ?? -122.4194;
    const dist = calculateHaversineDistance(plat, plong, ilat, ilong);

    if (dist < 0.3) score += 20.0;
    else if (dist < 0.8) score += 15.0;
    else if (dist < 1.5) score += 10.0;
    else score += 5.0;

    // 4. Workload penalty
    score -= (profile.activeIncidentsCount * 10.0);

    return {
      ...profile,
      matchScore: Math.max(0, Math.round(score)),
      distanceKm: dist,
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}
