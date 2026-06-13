import type { CandidateId, CandidateTokenBoard, Effect, Party, PartyTokenBoard, VoterGroupId } from "../../types";

export function clampTokenCount(value: number): number {
  return Math.max(0, Math.round(value));
}

export function adjustCandidateToken(
  board: CandidateTokenBoard,
  voterGroupId: VoterGroupId,
  candidateId: CandidateId,
  delta: number
): CandidateTokenBoard {
  return {
    ...board,
    [voterGroupId]: {
      ...board[voterGroupId],
      [candidateId]: clampTokenCount((board[voterGroupId]?.[candidateId] ?? 0) + delta)
    }
  };
}

export function adjustPartyToken(
  board: PartyTokenBoard,
  voterGroupId: VoterGroupId,
  party: Party,
  delta: number
): PartyTokenBoard {
  return {
    ...board,
    [voterGroupId]: {
      ...board[voterGroupId],
      [party]: clampTokenCount((board[voterGroupId]?.[party] ?? 0) + delta)
    }
  };
}

export function applyCandidateEffects(
  board: CandidateTokenBoard,
  candidateId: CandidateId,
  effects: Effect[]
): CandidateTokenBoard {
  return effects.reduce(
    (nextBoard, effect) => adjustCandidateToken(nextBoard, effect.voterGroupId, candidateId, effect.delta),
    board
  );
}

export function applyPartyEffects(board: PartyTokenBoard, party: Party, effects: Effect[]): PartyTokenBoard {
  return effects.reduce((nextBoard, effect) => adjustPartyToken(nextBoard, effect.voterGroupId, party, effect.delta), board);
}
