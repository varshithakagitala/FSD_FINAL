import { IncidentCategory, IncidentPriority } from '../models/Incident';

/**
 * Transparent, deterministic rule-based severity engine for campus emergencies.
 * Formula:
 * 1. Base category weight:
 *    - Fire: 85, Medical: 80, Electrical: 70, Security: 65, Accident: 60, Infrastructure: 40, Other: 30
 * 2. Keyword heuristic modifiers:
 *    - Critical keywords: +20 points ('unconscious', 'collapse', 'cardiac', 'explosion', 'flame', 'fire', 'smoke', 'weapon', 'bleeding', 'trapped')
 *    - Severe keywords: +15 points ('severe', 'fumes', 'chemical', 'shock', 'electric', 'leak', 'flood', 'injury')
 * 3. Priority mapping:
 *    - Score >= 85: Critical
 *    - Score >= 65: High
 *    - Score >= 45: Medium
 *    - Score < 45: Low
 */
export function calculateSuggestedPriority(
  category: IncidentCategory,
  description: string,
  title: string
): IncidentPriority {
  let score = 30;
  switch (category) {
    case 'Fire':
      score = 85;
      break;
    case 'Medical':
      score = 80;
      break;
    case 'Electrical':
      score = 70;
      break;
    case 'Security':
      score = 65;
      break;
    case 'Accident':
      score = 60;
      break;
    case 'Infrastructure':
      score = 40;
      break;
    default:
      score = 30;
      break;
  }

  const combined = `${title || ''} ${description || ''}`.toLowerCase();

  const criticalKeywords = [
    'unconscious',
    'collapse',
    'cardiac',
    'explosion',
    'flame',
    'fire',
    'smoke',
    'weapon',
    'gun',
    'knife',
    'active shooter',
    'bleeding',
    'trapped',
    'burn',
  ];
  for (const kw of criticalKeywords) {
    if (combined.includes(kw)) {
      score += 20;
      break;
    }
  }

  const severeKeywords = [
    'severe',
    'fumes',
    'chemical',
    'shock',
    'electric',
    'leak',
    'flood',
    'injury',
    'fracture',
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
