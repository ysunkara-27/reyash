import { candidateIds, partyCandidateIds } from "../data/candidates";
import { voterGroups } from "../data/voterGroups";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";
import type { CandidateId, Party, VoterGroupId } from "../types";
import TokenStepper from "./TokenStepper";

function candidateController(tokens: Record<CandidateId, number>): string {
  const entries = candidateIds.map((id) => [id, tokens[id]] as [CandidateId, number]);
  const max = Math.max(...entries.map(([, count]) => count));
  if (max === 0) return "No control";
  const leaders = entries.filter(([, count]) => count === max);
  return leaders.length === 1 ? leaders[0][0] : "Tie";
}

function partyControllerForPrimary(tokens: Record<CandidateId, number>): string {
  const blue = partyCandidateIds.blue.reduce((sum, id) => sum + tokens[id], 0);
  const red = partyCandidateIds.red.reduce((sum, id) => sum + tokens[id], 0);
  if (blue === red) return blue === 0 ? "No control" : "Tie";
  return blue > red ? "Blue" : "Red";
}

function partyController(tokens: Record<Party, number>): string {
  if (tokens.blue === tokens.red) return tokens.blue === 0 ? "No control" : "Tie";
  return tokens.blue > tokens.red ? "Blue" : "Red";
}

export default function VoterGroupsTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const generalMode = store.phase === "general" || store.phase === "electionNight" || store.phase === "complete";

  if (generalMode) {
    const blueGroups = voterGroups.filter((group) => {
      const counts = store.generalTokens[group.id];
      return counts.blue > counts.red;
    }).length;
    const redGroups = voterGroups.filter((group) => {
      const counts = store.generalTokens[group.id];
      return counts.red > counts.blue;
    }).length;
    return (
      <section className="panel overflow-x-auto">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">General Election Voter Groups</h2>
            <p className="text-sm text-slate-600">Track party control by voter group.</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="stat-card border-blue-200 bg-blue-50 text-blue-900">
              <div className="text-xs font-bold uppercase">Blue controls</div>
              <div className="text-2xl font-black">{blueGroups}</div>
            </div>
            <div className="stat-card border-red-200 bg-red-50 text-red-900">
              <div className="text-xs font-bold uppercase">Red controls</div>
              <div className="text-2xl font-black">{redGroups}</div>
            </div>
          </div>
        </div>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="table-head">
            <tr>
              <th className="p-2">Voter group</th>
              <th className="p-2 text-blue-800">Blue tokens</th>
              <th className="p-2 text-red-800">Red tokens</th>
              <th className="p-2">Controller</th>
              <th className="p-2">Locked?</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {voterGroups.map((group) => {
              const counts = store.generalTokens[group.id];
              const overMax = counts.blue > group.maxTokens || counts.red > group.maxTokens;
              return (
                <tr key={group.id} className={overMax ? "border-b border-amber-300 bg-amber-50" : "border-b border-slate-200"}>
                  <td className="p-2 font-bold">{group.name}</td>
                  <td className="p-2">
                    <TokenStepper value={counts.blue} tone="blue" disabled={!permissions.canEditTokens} onChange={(delta) => store.adjustGeneralToken(group.id, "blue", delta)} />
                  </td>
                  <td className="p-2">
                    <TokenStepper value={counts.red} tone="red" disabled={!permissions.canEditTokens} onChange={(delta) => store.adjustGeneralToken(group.id, "red", delta)} />
                  </td>
                  <td className="p-2 font-black">{partyController(counts)}</td>
                  <td className="p-2">
                    <button className="btn" onClick={() => store.toggleLock(group.id)} disabled={!permissions.canEditTokens}>
                      {store.lockedGroups[group.id] ? "Locked" : "Unlocked"}
                    </button>
                  </td>
                  <td className="p-2">
                    <input className="input" value={store.notes[group.id]} disabled={!permissions.canEditTokens} onChange={(event) => store.setNote(group.id, event.target.value)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    );
  }

  const primaryLeaders = candidateIds
    .map((id) => ({
      id,
      groups: voterGroups.filter((group) => candidateController(store.primaryTokens[group.id]) === id).length
    }))
    .sort((a, b) => b.groups - a.groups);

  return (
    <section className="panel overflow-x-auto">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Primary Voter Groups</h2>
          <p className="text-sm text-slate-600">Track candidate tokens and voter-group control.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {primaryLeaders.slice(0, 3).map((leader) => (
            <div key={leader.id} className={`stat-card ${leader.id.startsWith("blue") ? "border-blue-200 bg-blue-50 text-blue-900" : "border-red-200 bg-red-50 text-red-900"}`}>
              <div className="text-xs font-bold uppercase">{leader.id}</div>
              <div className="text-2xl font-black">{leader.groups}</div>
            </div>
          ))}
        </div>
      </div>
      <table className="w-full min-w-[1200px] text-sm">
        <thead className="table-head">
          <tr>
            <th className="p-2">Voter group</th>
            {candidateIds.map((id) => (
              <th key={id} className={`p-2 ${id.startsWith("blue") ? "text-blue-800" : "text-red-800"}`}>
                {id}
              </th>
            ))}
            <th className="p-2">Current controller</th>
            <th className="p-2">Party controller</th>
            <th className="p-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {voterGroups.map((group) => {
            const counts = store.primaryTokens[group.id as VoterGroupId];
            const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
            return (
              <tr key={group.id} className={total > group.maxTokens ? "border-b border-amber-300 bg-amber-50" : "border-b border-slate-200"}>
                <td className="p-2 font-bold">{group.name}</td>
                {candidateIds.map((id) => (
                  <td key={id} className="p-2">
                    <TokenStepper
                      value={counts[id]}
                      tone={id.startsWith("blue") ? "blue" : "red"}
                      disabled={!permissions.canEditTokens}
                      onChange={(delta) => store.adjustPrimaryToken(group.id, id, delta)}
                    />
                  </td>
                ))}
                <td className="p-2 font-black">{candidateController(counts)}</td>
                <td className="p-2 font-black">{partyControllerForPrimary(counts)}</td>
                <td className="p-2">
                  <input className="input" value={store.notes[group.id]} disabled={!permissions.canEditTokens} onChange={(event) => store.setNote(group.id, event.target.value)} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
