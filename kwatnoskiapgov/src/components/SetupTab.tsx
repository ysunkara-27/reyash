import { candidateById, candidates } from "../data/candidates";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";
import type { CandidateId, Party } from "../types";

export default function SetupTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="panel">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-black">Setup Players</h2>
          <button className="btn" onClick={store.loadSampleGame} disabled={!permissions.canEditSetup}>
            Load sample game
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="table-head">
              <tr>
                <th className="p-2">Player</th>
                <th className="p-2">Party</th>
                <th className="p-2">Candidate</th>
                <th className="p-2">Card Effects</th>
              </tr>
            </thead>
            <tbody>
              {store.players.map((player, index) => (
                <tr key={player.id} className="border-b border-slate-200">
                  <td className="p-2">
                    <input
                      className="input"
                      value={player.name}
                      disabled={!permissions.canEditSetup}
                      onChange={(event) => store.setPlayer(index, { ...player, name: event.target.value })}
                    />
                  </td>
                  <td className="p-2">
                    <select
                      className="input"
                      value={player.party}
                      disabled={!permissions.canEditSetup}
                      onChange={(event) => {
                        const party = event.target.value as Party;
                        const candidateId = `${party}${candidateById[player.candidateId].letter}` as CandidateId;
                        store.setPlayer(index, { ...player, party, candidateId });
                      }}
                    >
                      <option value="blue">Blue</option>
                      <option value="red">Red</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <select
                      className="input"
                      value={player.candidateId}
                      disabled={!permissions.canEditSetup}
                      onChange={(event) =>
                        store.setPlayer(index, {
                          ...player,
                          candidateId: event.target.value as CandidateId,
                          party: candidateById[event.target.value as CandidateId].party
                        })
                      }
                    >
                      {candidates.map((candidate) => (
                        <option key={candidate.id} value={candidate.id}>
                          {candidate.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 text-slate-700">
                    {candidateById[player.candidateId].effects
                      .map((effect) => `${effect.voterGroupId.replaceAll("-", " ")} ${effect.delta > 0 ? "+" : ""}${effect.delta}`)
                      .join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel space-y-4">
        <h2 className="text-2xl font-black">Start Controls</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-bold text-slate-700">Incumbent</span>
          <select
            className="input"
            value={store.incumbentCandidateId ?? ""}
            disabled={!permissions.canEditSetup}
            onChange={(event) => store.setIncumbent((event.target.value || null) as CandidateId | null)}
          >
            <option value="">No incumbent selected</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-2">
          <button className="btn" onClick={store.applySetupCandidateEffects} disabled={!permissions.canEditSetup}>
            Apply candidate effects
          </button>
          <button className="btn" onClick={store.applyIncumbencyRule} disabled={!store.incumbentCandidateId || !permissions.canEditSetup}>
            Apply incumbency rule
          </button>
          <button className="btn btn-primary" onClick={store.startGame} disabled={!permissions.canEditSetup}>
            Start game
          </button>
          <button className="btn" onClick={store.undo} disabled={!permissions.canUndo}>
            Undo last action
          </button>
          <button
            className="btn border-red-300 text-red-800"
            onClick={() => {
              if (window.confirm("Reset the entire game? This cannot be undone from the current game state.")) store.resetGame();
            }}
            disabled={!permissions.canResetGame}
          >
            Reset game
          </button>
        </div>
        <div className="border-t border-slate-200 pt-3 text-sm text-slate-700">
          Current phase: <span className="font-bold capitalize">{store.phase}</span>
          <br />
          Current month: <span className="font-bold">{store.currentMonth}</span>
        </div>
      </section>
    </div>
  );
}
