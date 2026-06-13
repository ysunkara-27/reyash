import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { downloadTextFile } from "../lib/storage";
import { electionResultsToCsv } from "../lib/exportCsv";
import { getPermissions } from "../lib/permissions";
import StateResultTable from "./StateResultTable";

export default function ElectionNightTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const [showExplanations, setShowExplanations] = useState(true);
  const results = store.electionResults;

  return (
    <div className="grid gap-4">
      <section className="panel">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Election Night</h2>
            <p className="text-sm text-slate-700">Needed to win: 270 electoral votes</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => store.runElection("fullMap")} disabled={!permissions.canRunElectionNight}>
              Calculate Full Map
            </button>
            <button className="btn" onClick={() => store.runElection("legacy")} disabled={!permissions.canRunElectionNight}>
              Classroom Legacy Mode
            </button>
            <button className="btn" onClick={store.resetElection} disabled={!permissions.canRunElectionNight}>
              Reset calculation
            </button>
            <button className="btn" onClick={() => downloadTextFile("election-results.csv", electionResultsToCsv(results), "text/csv")}>
              Export results CSV
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="border border-blue-200 bg-blue-50 p-5" style={{ borderRadius: 8 }}>
          <div className="text-sm font-bold text-blue-900">Blue Electoral Votes</div>
          <div className="text-5xl font-black text-blue-900">{results?.blueElectoralVotes ?? 0}</div>
        </div>
        <div className="border border-red-200 bg-red-50 p-5" style={{ borderRadius: 8 }}>
          <div className="text-sm font-bold text-red-900">Red Electoral Votes</div>
          <div className="text-5xl font-black text-red-900">{results?.redElectoralVotes ?? 0}</div>
        </div>
        <div className="border border-slate-200 bg-white p-5" style={{ borderRadius: 8 }}>
          <div className="text-sm font-bold">Winner</div>
          <div className="text-4xl font-black capitalize">{results?.winner ?? "Pending"}</div>
        </div>
      </section>

      {results && (
        <section className="panel">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">{results.mode === "fullMap" ? "Full Map Results" : "Classroom Legacy Purple States"}</h3>
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" checked={showExplanations} onChange={(event) => setShowExplanations(event.target.checked)} />
              Show all explanations
            </label>
          </div>
          <StateResultTable
            results={results.stateResults}
            showExplanations={showExplanations}
            readOnly={!permissions.canOverrideResults}
            onOverride={(stateId, winner) => {
              if (window.confirm(`Override ${stateId} to ${winner}?`)) store.overrideStateWinner(stateId, winner);
            }}
          />
        </section>
      )}
    </div>
  );
}
