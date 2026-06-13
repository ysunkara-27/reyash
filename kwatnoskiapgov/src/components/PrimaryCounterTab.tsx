import { useMemo, useState } from "react";
import { candidateIds } from "../data/candidates";
import { schedule } from "../data/schedule";
import { stateById, states } from "../data/states";
import { useGameStore } from "../store/gameStore";
import type { Month } from "../types";
import { calculatePrimaryForState } from "../lib/rules/primaryRules";
import { getPermissions } from "../lib/permissions";

export default function PrimaryCounterTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const [selectedMonth, setSelectedMonth] = useState<Month>("January");
  const [manualState, setManualState] = useState("IA");
  const selectedStateIds = store.selectedStatesByMonth[selectedMonth] ?? [];
  const [counterStateIds, setCounterStateIds] = useState<string[]>(selectedStateIds.length ? selectedStateIds : ["IA"]);

  const results = useMemo(
    () => counterStateIds.map((id) => stateById[id]).filter(Boolean).map((state) => calculatePrimaryForState(state, store.primaryTokens)),
    [counterStateIds, store.primaryTokens]
  );

  return (
    <div className="grid gap-4">
      <section className="panel">
        <div className="flex flex-wrap items-end gap-3">
          <label>
            <span className="mb-1 block text-sm font-bold">Month</span>
            <select
              className="input w-52"
              value={selectedMonth}
              onChange={(event) => {
                const month = event.target.value as Month;
                setSelectedMonth(month);
                setCounterStateIds(store.selectedStatesByMonth[month] ?? []);
              }}
            >
              {schedule
                .filter((item) => item.primaryStateCount)
                .map((item) => (
                  <option key={item.month} value={item.month}>
                    {item.month}
                  </option>
                ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-sm font-bold">Add state</span>
            <select className="input w-56" value={manualState} onChange={(event) => setManualState(event.target.value)}>
              {states.map((state) => (
                <option key={state.id} value={state.id}>
                  {state.name}
                </option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={() => setCounterStateIds(Array.from(new Set([...counterStateIds, manualState])))}>
            Add to counter
          </button>
          <button className="btn" onClick={() => setCounterStateIds(selectedStateIds)}>
            Use month states
          </button>
          {permissions.canFinalizePrimaries ? (
            <button
              className="btn btn-primary"
              onClick={() => {
                if (window.confirm(`Finalize primary results for ${counterStateIds.length} state(s)?`)) {
                  store.finalizePrimaryStates(counterStateIds);
                }
              }}
            >
              Finalize Primary
            </button>
          ) : (
            <div className="text-sm font-bold text-slate-600">Preview only. Teacher finalizes results.</div>
          )}
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-3 text-2xl font-black">Running Delegate Totals</h2>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {candidateIds.map((id) => (
            <div key={id} className={`border p-3 ${id.startsWith("blue") ? "border-blue-200 bg-blue-50" : "border-red-200 bg-red-50"}`} style={{ borderRadius: 8 }}>
              <div className="text-sm font-bold">{id}</div>
              <div className="text-3xl font-black">{store.delegateTotals[id]}</div>
            </div>
          ))}
        </div>
      </section>

      {results.map((result) => {
        const state = stateById[result.stateId];
        return (
          <section key={result.stateId} className="panel overflow-x-auto">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-black">{result.stateName}</h2>
                <p className="text-sm text-slate-700">
                  {state.electoralVotes} electoral votes. Primary type: <span className="font-bold">{state.primaryType}</span>. Total assigned:{" "}
                  <span className="font-bold">{result.totalAssignedDelegates}</span>
                </p>
              </div>
              {result.needsTeacherDecision && <div className="border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">Teacher decision needed</div>}
            </div>
            <table className="w-full min-w-[900px] text-sm">
              <thead className="table-head">
                <tr>
                  <th className="p-2">Voter group</th>
                  <th className="p-2">Delegate value</th>
                  {candidateIds.map((id) => (
                    <th key={id} className="p-2">
                      {id}
                    </th>
                  ))}
                  <th className="p-2">Winner</th>
                  <th className="p-2">Explanation</th>
                </tr>
              </thead>
              <tbody>
                {result.groupResults.map((groupResult) => {
                  const counts = store.primaryTokens[groupResult.voterGroupId];
                  return (
                    <tr key={groupResult.voterGroupId} className="border-b border-slate-200">
                      <td className="p-2 font-bold">{groupResult.voterGroupName}</td>
                      <td className="p-2">{groupResult.delegates}</td>
                      {candidateIds.map((id) => (
                        <td key={id} className="p-2">
                          {counts[id]}
                        </td>
                      ))}
                      <td className="p-2 font-black">{groupResult.status === "assigned" ? groupResult.winners.join(", ") : groupResult.status}</td>
                      <td className="p-2 text-slate-700">{groupResult.explanation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
