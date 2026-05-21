export type CharacterFieldName =
  | 'ability_blank'
  | 'support1_blank'
  | 'support2_blank'
  | 'support3_blank';

export type Character = {
  id: string;
  student_number: number;
  name: string;
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
  ability_blank: string;
  support1_blank: string;
  support2_blank: string;
  support3_blank: string;
};

export type Situation = {
  id: string;
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

export type RewriteLog = {
  id: string;
  character_id: string;
  student_number: number;
  field_name: CharacterFieldName;
  before_text: string;
  after_text: string;
  created_at: string;
};

export type RewriteLogInput = Omit<RewriteLog, 'id' | 'created_at'>;

export type BattleResult = {
  story: string;
  winner: 'A' | 'B';
  winnerCharacterId: string;
  winnerName: string;
  reason: string;
  evidence: {
    topicSentence: string;
    supportSentence: string;
  };
  rewriteTip: string;
  usedFallback?: boolean;
  fallbackReason?: string;
};
