export type CharacterFieldName =
  | 'ability_blank'
  | 'support1_blank'
  | 'support2_blank'
  | 'support3_blank';

export type Character = {
  id: string;
  student_number: number;
  name: string;
  subject_particle: '은' | '는';
  ability_blank: string;
  support1_blank: string;
  support2_blank: string;
  support3_blank: string;
  is_representative: boolean;
  created_at: string;
  updated_at: string;
};

export type CharacterInput = {
  student_number: number;
  name: string;
  subject_particle: '은' | '는';
  ability_blank: string;
  support1_blank: string;
  support2_blank: string;
  support3_blank: string;
};

export type Situation = {
  id: string;
  title: string;
  text: string;
  keywords: string[];
};

export type BattleRecord = {
  id: string;
  character_a_id: string;
  character_b_id: string;
  winner_character_id: string;
  situation_id: string;
  situation_text: string;
  story: string;
  reason: string;
  evidence_topic_sentence: string | null;
  evidence_support_sentence: string | null;
  rewrite_tip: string | null;
  created_at: string;
};

export type BattleRecordInput = Omit<BattleRecord, 'id' | 'created_at'>;

export type CharacterDeletionLog = {
  id: string;
  student_number: number;
  deleted_character_id: string;
  character_name: string;
  created_at: string;
};

export type CharacterDeletionLogInput = Omit<CharacterDeletionLog, 'id' | 'created_at'>;

export type BattleResult = {
  story: string;
  winner: 'A' | 'B';
  winnerCharacterId: string;
  winnerName: string;
  usedFallback?: boolean;
  fallbackReason?: string;
};
