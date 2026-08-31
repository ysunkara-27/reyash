import { Lock, Shuffle, StepForward } from "lucide-react";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";

export default function TurnBanner() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const order = store.turnOrdersByMonth[store.currentMonth] ?? [];
  const index = store.currentTurnIndexByMonth[store.currentMonth] ?? 0;
  const currentPlayerId = order[index];
  const currentPlayer = store.players.find((player) => player.id === currentPlayerId);

  return (
    <section className={`mb-4 border p-3 shadow-sm ${store.gameLocked ? "border-amber-300 bg-amber-50" : "border-blue-200 bg-blue-50"}`} style={{ borderRadius: 8 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-black uppercase text-slate-600">
            {store.gameLocked && <Lock size={16} />} Current turn
          </div>
          <div className="text-2xl font-black text-slate-950">
            {store.gameLocked ? "Game locked by teacher" : currentPlayer ? `${currentPlayer.name} (${currentPlayer.candidateId})` : "No turn order set"}
          </div>
          <div className="text-sm text-slate-700">
            {store.currentMonth} turn order {order.length ? `${Math.min(index + 1, order.length)} of ${order.length}` : "has not been randomized yet"}.
          </div>
        </div>
        {permissions.canManageCalendar && !store.gameLocked && (
          <div className="flex gap-2">
            <button className="btn" onClick={() => store.randomizeTurnOrder()}>
              <Shuffle size={16} /> Randomize
            </button>
            <button className="btn btn-primary" onClick={store.nextTurn} disabled={order.length === 0}>
              <StepForward size={16} /> Next turn
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
