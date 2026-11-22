import { IResponderProfile } from '../models/ResponderProfile';
import { IIncident } from '../models/Incident';

export interface RankedResponder {
  responder: IResponderProfile;
  matchScore: number;
  distanceKm: number;
  breakdown: {
    specializationScore: number;
    availabilityScore: number;
    distanceScore: number;
    workloadPenalty: number;
  };
}

export function calculateHaversineDistance(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return -1;
  }

  const earthRadiusKm = 6371.0;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const rLat1 = lat1 * (Math.PI / 180);
  const rLat2 = lat2 * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusKm * c * 100) / 100;
}

export function rankResponders(
  responders: IResponderProfile[],
  incident: IIncident
): RankedResponder[] {
  return responders
    .map((profile) => {
      let specScore = 10;
      if (profile.specialization.toLowerCase() === incident.category.toLowerCase()) {
        specScore = 40;
      } else if (
        profile.specialization === 'General' ||
        (profile.specialization === 'Security' && incident.category === 'Accident')
      ) {
        specScore = 20;
      }

      let availScore = 0;
      if (profile.currentStatus === 'Available') availScore = 30;
      else if (profile.currentStatus === 'Dispatched') availScore = 10;
      else if (profile.currentStatus === 'Busy') availScore = 5;
      else availScore = -30; // Off duty

      const distanceKm = calculateHaversineDistance(
        profile.currentLatitude,
        profile.currentLongitude,
        incident.latitude,
        incident.longitude
      );

      let distScore = 10; // fallback if GPS coordinates absent
      if (distanceKm >= 0) {
        if (distanceKm < 0.3) distScore = 20;
        else if (distanceKm < 0.8) distScore = 15;
        else if (distanceKm < 1.5) distScore = 10;
        else distScore = 5;
      }

      const workloadPenalty = profile.activeIncidentsCount * 10;
      const totalScore = Math.max(0, specScore + availScore + distScore - workloadPenalty);

      return {
        responder: profile,
        matchScore: totalScore,
        distanceKm: distanceKm >= 0 ? distanceKm : 0,
        breakdown: {
          specializationScore: specScore,
          availabilityScore: availScore,
          distanceScore: distScore,
          workloadPenalty,
        },
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
