import type { Character } from '../types';
import type { StudentBattleRecord } from '../services/battleService';

export type CharacterWinStreak = {
  characterId: string;
  characterName: string;
  wins: number;
};

export function getCurrentWinStreakForCharacter(characterId: string, records: StudentBattleRecord[]) {
  let streak = 0;

  for (const record of records) {
    if (record.character_a_id !== characterId && record.character_b_id !== characterId) {
      continue;
    }

    if (record.winner_character_id !== characterId) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function getBestCurrentWinStreak(characters: Character[], records: StudentBattleRecord[]) {
  return characters
    .map((character) => ({
      characterId: character.id,
      characterName: character.name,
      wins: getCurrentWinStreakForCharacter(character.id, records),
    }))
    .filter((streak) => streak.wins >= 2)
    .sort((a, b) => b.wins - a.wins || a.characterName.localeCompare(b.characterName, 'ko'))[0] || null;
}
