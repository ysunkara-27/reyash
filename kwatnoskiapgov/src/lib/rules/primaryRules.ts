import { candidateById, candidateIds, partyCandidateIds } from "../../data/candidates";
import { voterGroupNameById } from "../../data/voterGroups";
import type {
  CandidateId,
  CandidateTokenBoard,
  DelegateTotals,
  Party,
  PrimaryType,
  StateData,
  VoterGroupId
} from "../../types";

export interface PrimaryGroupResult {
  voterGroupId: VoterGroupId;
  voterGroupName: string;
  delegates: number;
  winners: CandidateId[];
  status: "assigned" | "unassigned" | "tie";
  explanation: string;
}

export interface PrimaryStateResult {
  stateId: string;
  stateName: string;
  primaryType: PrimaryType;
  groupResults: PrimaryGroupResult[];
  delegateTotals: DelegateTotals;
  totalAssignedDelegates: number;
  needsTeacherDecision: boolean;
}

export function emptyDelegateTotals(): DelegateTotals {
  return Object.fromEntries(candidateIds.map((candidateId) => [candidateId, 0])) as DelegateTotals;
}

function topCandidates(entries: Array<[CandidateId, number]>): { winners: CandidateId[]; max: number } {
  const max = Math.max(...entries.map(([, count]) => count), 0);
  return { winners: entries.filter(([, count]) => count === max && count > 0).map(([id]) => id), max };
}

function calculateOpenWinner(counts: Record<CandidateId, number>): PrimaryGroupResult["winners"] | "tie" | "none" {
  const eligible = candidateIds.map((id) => [id, counts[id] ?? 0] as [CandidateId, number]).filter(([, count]) => count >= 3);
  if (eligible.length === 0) return "none";
  const { winners } = topCandidates(eligible);
  return winners.length === 1 ? winners : "tie";
}

function calculateClosedWinners(counts: Record<CandidateId, number>): PrimaryGroupResult["winners"] | "tie" | "none" {
  const winners: CandidateId[] = [];
  let hasTie = false;
  (Object.keys(partyCandidateIds) as Party[]).forEach((party) => {
    const partyEntries = partyCandidateIds[party].map((id) => [id, counts[id] ?? 0] as [CandidateId, number]);
    const partyTotal = partyEntries.reduce((sum, [, count]) => sum + count, 0);
    if (partyTotal === 0) return;
    const { winners: partyWinners, max } = topCandidates(partyEntries);
    if (partyWinners.length > 1 && max > 0) {
      hasTie = true;
      return;
    }
    if (partyWinners.length === 1 && max > partyTotal / 2) {
      winners.push(partyWinners[0]);
    }
  });
  if (hasTie) return "tie";
  return winners.length > 0 ? winners : "none";
}

export function calculatePrimaryForState(
  state: StateData,
  board: CandidateTokenBoard,
  modeOverride?: "open" | "closed"
): PrimaryStateResult {
  const effectiveType = modeOverride ?? (state.primaryType === "unknown" ? "open" : state.primaryType);
  const groupResults = state.voterGroups.map((group) => {
    const counts = board[group.voterGroupId];
    const winnerResult =
      effectiveType === "closed" || effectiveType === "semiClosed"
        ? calculateClosedWinners(counts)
        : calculateOpenWinner(counts);

    if (winnerResult === "tie") {
      return {
        voterGroupId: group.voterGroupId,
        voterGroupName: voterGroupNameById[group.voterGroupId],
        delegates: group.percentage,
        winners: [],
        status: "tie" as const,
        explanation: "Tie / teacher decision needed."
      };
    }
    if (winnerResult === "none") {
      return {
        voterGroupId: group.voterGroupId,
        voterGroupName: voterGroupNameById[group.voterGroupId],
        delegates: group.percentage,
        winners: [],
        status: "unassigned" as const,
        explanation: "No candidate controls this voter group."
      };
    }
    const labels = winnerResult.map((winner) => candidateById[winner].name).join(" and ");
    return {
      voterGroupId: group.voterGroupId,
      voterGroupName: voterGroupNameById[group.voterGroupId],
      delegates: group.percentage,
      winners: winnerResult,
      status: "assigned" as const,
      explanation: `${labels} receives ${group.percentage} delegates from ${voterGroupNameById[group.voterGroupId]}.`
    };
  });

  const delegateTotals = emptyDelegateTotals();
  groupResults.forEach((result) => {
    result.winners.forEach((winner) => {
      delegateTotals[winner] += result.delegates;
    });
  });

  return {
    stateId: state.id,
    stateName: state.name,
    primaryType: state.primaryType,
    groupResults,
    delegateTotals,
    totalAssignedDelegates: Object.values(delegateTotals).reduce((sum, total) => sum + total, 0),
    needsTeacherDecision: groupResults.some((result) => result.status === "tie")
  };
}

export function addDelegateTotals(base: DelegateTotals, addition: DelegateTotals): DelegateTotals {
  return Object.fromEntries(candidateIds.map((id) => [id, base[id] + addition[id]])) as DelegateTotals;
}
