import { candidateById, candidateIds, partyCandidateIds } from "../../data/candidates";
import { voterGroups } from "../../data/voterGroups";
import type { CandidateId, CandidateTokenBoard, DelegateTotals, Party, PartyTokenBoard } from "../../types";
import { adjustPartyToken, applyPartyEffects } from "./tokenRules";

export function detectNominee(delegateTotals: DelegateTotals, party: Party): CandidateId {
  return partyCandidateIds[party].reduce((leader, candidateId) =>
    delegateTotals[candidateId] > delegateTotals[leader] ? candidateId : leader
  );
}

export function createBaseGeneralBoard(): PartyTokenBoard {
  const blueBase = new Set([
    "asian-americans",
    "african-americans",
    "environmental-activists",
    "hispanic-latino",
    "indigenous-voters",
    "labor-unions",
    "secular-non-religious",
    "suburban-women",
    "urban-professionals",
    "youth-voters"
  ]);
  return Object.fromEntries(
    voterGroups.map((group) => [
      group.id,
      {
        blue: blueBase.has(group.id) ? 3 : 0,
        red: blueBase.has(group.id) ? 0 : 3
      }
    ])
  ) as PartyTokenBoard;
}

export function createEmptyPrimaryBoard(): CandidateTokenBoard {
  return Object.fromEntries(
    voterGroups.map((group) => [
      group.id,
      Object.fromEntries(candidateIds.map((candidateId) => [candidateId, 0])) as Record<CandidateId, number>
    ])
  ) as CandidateTokenBoard;
}

export function applyNomineeEffects(board: PartyTokenBoard, nominee: CandidateId): PartyTokenBoard {
  const candidate = candidateById[nominee];
  return applyPartyEffects(board, candidate.party, candidate.effects);
}

export function applyPlatformEffects(
  board: PartyTokenBoard,
  party: Party,
  platformEffects: Array<{ voterGroupId: Parameters<typeof adjustPartyToken>[1]; delta: number }>
): PartyTokenBoard {
  return platformEffects.reduce((nextBoard, effect) => adjustPartyToken(nextBoard, effect.voterGroupId, party, effect.delta), board);
}
