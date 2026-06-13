import { useState } from "react";
import { voterGroups } from "../data/voterGroups";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";
import type { Party, VoterGroupId } from "../types";
import TokenStepper from "./TokenStepper";

export default function GeneralElectionTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const [surrogateGroup, setSurrogateGroup] = useState<VoterGroupId>(voterGroups[0].id);
  const [party, setParty] = useState<Party>("blue");
  const opponent: Party = party === "blue" ? "red" : "blue";

  return (
    <div className="grid gap-4">
      <section className="panel">
        <h2 className="mb-3 text-2xl font-black">Surrogate Actions</h2>
        <div className="flex flex-wrap items-end gap-3">
          <select className="input w-52" value={party} onChange={(event) => setParty(event.target.value as Party)}>
            <option value="blue">Blue nominee team</option>
            <option value="red">Red nominee team</option>
          </select>
          <select className="input w-64" value={surrogateGroup} onChange={(event) => setSurrogateGroup(event.target.value as VoterGroupId)}>
            {voterGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <button className="btn" onClick={() => store.adjustGeneralToken(surrogateGroup, opponent, -1)} disabled={!permissions.canEditTokens}>
            Attack Dog
          </button>
          <button className="btn" onClick={() => store.adjustGeneralToken(surrogateGroup, party, 1)} disabled={!permissions.canEditTokens}>
            Bridge Builder
          </button>
          <button className="btn" onClick={() => store.recordAction(`${party} Fundraising Chair: draw 2 strategy cards.`, "canApplyCards")} disabled={!permissions.canApplyCards}>
            Fundraising Chair
          </button>
          <button className="btn" onClick={() => store.toggleLock(surrogateGroup)} disabled={!permissions.canEditTokens}>
            Policy Envoy
          </button>
          <button className="btn" onClick={store.undo} disabled={!permissions.canUndo}>
            Undo last action
          </button>
        </div>
      </section>

      <section className="panel overflow-x-auto">
        <h2 className="mb-3 text-2xl font-black">General Election Board</h2>
        <table className="w-full min-w-[900px] text-sm">
          <thead className="table-head">
            <tr>
              <th className="p-2">Voter group</th>
              <th className="p-2 text-blue-800">Blue tokens</th>
              <th className="p-2 text-red-800">Red tokens</th>
              <th className="p-2">Controller</th>
              <th className="p-2">Locked</th>
              <th className="p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {voterGroups.map((group) => {
              const counts = store.generalTokens[group.id];
              const controller = counts.blue === counts.red ? (counts.blue ? "Tie" : "No control") : counts.blue > counts.red ? "Blue" : "Red";
              return (
                <tr key={group.id} className="border-b border-slate-200">
                  <td className="p-2 font-bold">{group.name}</td>
                  <td className="p-2">
                    <TokenStepper value={counts.blue} tone="blue" disabled={!permissions.canEditTokens} onChange={(delta) => store.adjustGeneralToken(group.id, "blue", delta)} />
                  </td>
                  <td className="p-2">
                    <TokenStepper value={counts.red} tone="red" disabled={!permissions.canEditTokens} onChange={(delta) => store.adjustGeneralToken(group.id, "red", delta)} />
                  </td>
                  <td className="p-2 font-black">{controller}</td>
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
    </div>
  );
}
