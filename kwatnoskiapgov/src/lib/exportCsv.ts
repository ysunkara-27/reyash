import type { ElectionResults, SerializableGameState } from "../types";

function csvEscape(value: string | number | null): string {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function electionResultsToCsv(results: ElectionResults | null): string {
  if (!results) return "state,electoralVotes,bluePercentage,redPercentage,winner,explanation\n";
  const rows = results.stateResults.map((result) =>
    [
      result.stateName,
      result.electoralVotes,
      result.bluePercentage,
      result.redPercentage,
      result.winner,
      result.explanation
    ]
      .map(csvEscape)
      .join(",")
  );
  return ["state,electoralVotes,bluePercentage,redPercentage,winner,explanation", ...rows].join("\n");
}

export function gameSummaryToCsv(state: SerializableGameState): string {
  const rows = [
    ["phase", state.phase],
    ["currentMonth", state.currentMonth],
    ["blueNominee", state.nominees.blue ?? ""],
    ["redNominee", state.nominees.red ?? ""],
    ["blueElectoralVotes", state.electionResults?.blueElectoralVotes ?? ""],
    ["redElectoralVotes", state.electionResults?.redElectoralVotes ?? ""],
    ["winner", state.electionResults?.winner ?? ""]
  ];
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}
