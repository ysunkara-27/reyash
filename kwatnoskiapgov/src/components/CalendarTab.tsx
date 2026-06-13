import { useState } from "react";
import { schedule } from "../data/schedule";
import { states } from "../data/states";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";
import type { Month } from "../types";

export default function CalendarTab({ goToPrimaryCounter }: { goToPrimaryCounter: () => void }) {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const [manualSelections, setManualSelections] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-3">
      {schedule.map((item) => {
        const selected = store.selectedStatesByMonth[item.month] ?? [];
        const complete = selected.length > 0 && selected.every((id) => store.completedPrimaryStates.includes(id));
        return (
          <section key={item.month} className={`panel ${store.currentMonth === item.month ? "border-slate-900" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">{item.month}</h2>
                <p className="text-sm text-slate-700">{item.instructions}</p>
                {selected.length > 0 && (
                  <p className="mt-2 text-sm">
                    <span className="font-bold">Selected states:</span>{" "}
                    {selected.map((id) => states.find((state) => state.id === id)?.name ?? id).join(", ")}
                  </p>
                )}
                <p className={`mt-1 text-sm font-bold ${complete ? "text-emerald-700" : "text-slate-600"}`}>
                  {complete ? "Complete" : "Not complete"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.primaryStateCount && (
                  <>
                    <button className="btn" onClick={() => store.drawStatesForMonth(item.month, item.primaryStateCount!, item.fixedStates)} disabled={!permissions.canManageCalendar}>
                      Draw states
                    </button>
                    <select
                      className="input w-56"
                      value={manualSelections[item.month] ?? ""}
                      onChange={(event) => setManualSelections({ ...manualSelections, [item.month]: event.target.value })}
                    >
                      <option value="">Manual add state</option>
                      {states.map((state) => (
                        <option key={state.id} value={state.id}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn"
                      disabled={!permissions.canManageCalendar}
                      onClick={() => {
                        const id = manualSelections[item.month];
                        if (id) store.setSelectedStates(item.month as Month, Array.from(new Set([...selected, id])));
                      }}
                    >
                      Add
                    </button>
                    <button className="btn" onClick={goToPrimaryCounter}>
                      Go to Primary Counter
                    </button>
                  </>
                )}
                {store.currentMonth === item.month && (
                  <button className="btn btn-primary" onClick={store.advanceMonth} disabled={!permissions.canManageCalendar}>
                    Advance month
                  </button>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
