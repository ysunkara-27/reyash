import { states } from "../../data/states";
import { voterGroupNameById } from "../../data/voterGroups";
import type { ElectionResults, ElectionStateResult, Party, PartyTokenBoard, StateData, VoterGroupId } from "../../types";

export function getPartyController(board: PartyTokenBoard, voterGroupId: VoterGroupId): Party | "tie" | null {
  const counts = board[voterGroupId] ?? { blue: 0, red: 0 };
  if (counts.blue === counts.red) return counts.blue === 0 ? null : "tie";
  return counts.blue > counts.red ? "blue" : "red";
}

export function calculateStateWinner(
  state: StateData,
  board: PartyTokenBoard,
  override?: Party | "tie" | "unassigned"
): ElectionStateResult {
  const controlledGroups = { blue: [] as string[], red: [] as string[] };
  let bluePercentage = 0;
  let redPercentage = 0;

  state.voterGroups.forEach((group) => {
    const controller = getPartyController(board, group.voterGroupId);
    if (controller === "blue") {
      bluePercentage += group.percentage;
      controlledGroups.blue.push(voterGroupNameById[group.voterGroupId]);
    }
    if (controller === "red") {
      redPercentage += group.percentage;
      controlledGroups.red.push(voterGroupNameById[group.voterGroupId]);
    }
  });

  const calculatedWinner =
    bluePercentage === redPercentage ? "tie" : bluePercentage > redPercentage ? "blue" : "red";
  const winner = override ?? calculatedWinner;
  const winningGroups = winner === "blue" || winner === "red" ? controlledGroups[winner] : [];
  const explanation =
    winner === "tie"
      ? `${state.name} is tied and needs a teacher decision.`
      : winner === "unassigned"
        ? `${state.name} is unassigned.`
        : `${winner === "blue" ? "Blue" : "Red"} wins ${state.name} because ${winner === "blue" ? "Blue" : "Red"} controls ${
            winningGroups.length ? winningGroups.join(", ") : "no listed voter groups"
          } for ${winner === "blue" ? bluePercentage : redPercentage}% of the electorate.`;

  return {
    stateId: state.id,
    stateName: state.name,
    electoralVotes: state.electoralVotes,
    bluePercentage,
    redPercentage,
    winner,
    explanation,
    controlledGroups
  };
}

export function calculateFullMapElection(
  board: PartyTokenBoard,
  overrides: Record<string, Party | "tie" | "unassigned"> = {}
): ElectionResults {
  const stateResults = states.map((state) => calculateStateWinner(state, board, overrides[state.id]));
  const blueElectoralVotes = stateResults.reduce(
    (sum, result) => sum + (result.winner === "blue" ? result.electoralVotes : 0),
    0
  );
  const redElectoralVotes = stateResults.reduce(
    (sum, result) => sum + (result.winner === "red" ? result.electoralVotes : 0),
    0
  );
  return {
    mode: "fullMap",
    blueElectoralVotes,
    redElectoralVotes,
    stateResults,
    winner:
      blueElectoralVotes >= 270 || redElectoralVotes >= 270
        ? blueElectoralVotes === redElectoralVotes
          ? "tie"
          : blueElectoralVotes > redElectoralVotes
            ? "blue"
            : "red"
        : null,
    calculatedAt: new Date().toISOString()
  };
}

export function calculateLegacyElection(
  board: PartyTokenBoard,
  overrides: Record<string, Party | "tie" | "unassigned"> = {}
): ElectionResults {
  const purpleStates = states.filter((state) => state.safeColor === "purple");
  const stateResults = purpleStates.map((state) => calculateStateWinner(state, board, overrides[state.id]));
  const blueElectoralVotes =
    208 + stateResults.reduce((sum, result) => sum + (result.winner === "blue" ? result.electoralVotes : 0), 0);
  const redElectoralVotes =
    226 + stateResults.reduce((sum, result) => sum + (result.winner === "red" ? result.electoralVotes : 0), 0);
  return {
    mode: "legacy",
    blueElectoralVotes,
    redElectoralVotes,
    stateResults,
    winner:
      blueElectoralVotes >= 270 || redElectoralVotes >= 270
        ? blueElectoralVotes === redElectoralVotes
          ? "tie"
          : blueElectoralVotes > redElectoralVotes
            ? "blue"
            : "red"
        : null,
    calculatedAt: new Date().toISOString()
  };
}
