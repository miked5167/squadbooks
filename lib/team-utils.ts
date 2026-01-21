/**
 * Utility functions for formatting team information
 */

import type { TeamType, AgeDivision, CompetitiveLevel } from '@prisma/client';

/**
 * Format team level display string from structured fields
 * Examples:
 *  - "U13 AA" (Representative team)
 *  - "House / Recreational" (House League)
 *  - "Adult Recreational" (Adult)
 *  - "U15 Other" (If competitive level is OTHER)
 */
export function formatTeamLevel(
  teamType?: TeamType | null,
  ageDivision?: AgeDivision | null,
  competitiveLevel?: CompetitiveLevel | null,
  legacyLevel?: string | null
): string {
  // Fallback to legacy level if new fields are not set
  if (!teamType || !ageDivision || !competitiveLevel) {
    return legacyLevel || 'Unknown';
  }

  // Special cases for house league and adult
  if (teamType === 'HOUSE_LEAGUE') {
    return 'House League';
  }

  if (teamType === 'ADULT_RECREATIONAL') {
    return 'Adult Recreational';
  }

  // For representative teams, show "AgeDivision CompetitiveLevel"
  // e.g., "U13 AA", "U15 AAA"
  const age = ageDivision === 'OTHER' ? '' : ageDivision;
  const level = formatCompetitiveLevel(competitiveLevel);

  // If both are valid, combine them
  if (age && level && level !== 'Other') {
    return `${age} ${level}`;
  }

  // If only age, return that
  if (age) {
    return age;
  }

  // If only level, return that
  if (level) {
    return level;
  }

  return 'Other';
}

/**
 * Format competitive level for display
 */
function formatCompetitiveLevel(level: CompetitiveLevel): string {
  const levelMap: Record<CompetitiveLevel, string> = {
    AAA: 'AAA',
    AA: 'AA',
    A: 'A',
    BB: 'BB',
    B: 'B',
    MD: 'MD',
    HOUSE_RECREATIONAL: 'House',
    NOT_APPLICABLE: 'N/A',
    OTHER: 'Other',
  };

  return levelMap[level] || 'Other';
}

/**
 * Get team display name with level
 * Example: "Newmarket Storm U13 AA"
 */
export function formatFullTeamName(
  name: string,
  teamType?: TeamType | null,
  ageDivision?: AgeDivision | null,
  competitiveLevel?: CompetitiveLevel | null,
  legacyLevel?: string | null
): string {
  const level = formatTeamLevel(teamType, ageDivision, competitiveLevel, legacyLevel);

  // Only append level if it's not "Unknown" or "Other"
  if (level && level !== 'Unknown' && level !== 'Other') {
    return `${name} ${level}`;
  }

  return name;
}
