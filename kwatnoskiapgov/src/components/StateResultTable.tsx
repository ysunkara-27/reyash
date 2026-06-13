import type { ElectionStateResult, Party } from "../types";

export default function StateResultTable({
  results,
  showExplanations,
  onOverride,
  readOnly = false
}: {
  results: ElectionStateResult[];
  showExplanations: boolean;
  onOverride: (stateId: string, winner: Party | "tie" | "unassigned") => void;
  readOnly?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse text-sm">
        <thead className="table-head">
          <tr>
            <th className="p-2">State</th>
            <th className="p-2">EV</th>
            <th className="p-2 text-blue-800">Blue %</th>
            <th className="p-2 text-red-800">Red %</th>
            <th className="p-2">Winner</th>
            {!readOnly && <th className="p-2">Override</th>}
            {showExplanations && <th className="p-2">Explanation</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.stateId} className="border-b border-slate-200">
              <td className="p-2 font-bold">{result.stateName}</td>
              <td className="p-2">{result.electoralVotes}</td>
              <td className="p-2 font-bold text-blue-800">{result.bluePercentage}</td>
              <td className="p-2 font-bold text-red-800">{result.redPercentage}</td>
              <td className="p-2 font-black capitalize">{result.winner}</td>
              {!readOnly && (
                <td className="p-2">
                  <select className="input" value={result.winner} onChange={(event) => onOverride(result.stateId, event.target.value as Party | "tie" | "unassigned")}>
                    <option value="blue">Blue</option>
                    <option value="red">Red</option>
                    <option value="tie">Tie</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                </td>
              )}
              {showExplanations && <td className="p-2 text-slate-700">{result.explanation}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
