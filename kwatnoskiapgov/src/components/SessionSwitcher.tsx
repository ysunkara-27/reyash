import { Layers3, Lock, Plus, Trash2, Unlock } from "lucide-react";
import { useState } from "react";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";

export default function SessionSwitcher() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const [newName, setNewName] = useState("");

  return (
    <section className="panel">
      <div className="mb-3 flex items-center gap-2 text-lg font-black">
        <Layers3 size={20} /> Classroom Games
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-56 flex-1">
          <span className="mb-1 block text-xs font-black uppercase text-slate-500">Active game</span>
          <select className="input" value={store.activeSessionId} onChange={(event) => store.switchSession(event.target.value)}>
            {store.sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name} {session.state.gameLocked ? "(locked)" : ""}
              </option>
            ))}
          </select>
        </label>
        {permissions.canViewTeacherTools && (
          <>
            <label className="min-w-48 flex-1">
              <span className="mb-1 block text-xs font-black uppercase text-slate-500">New game name</span>
              <input className="input" value={newName} placeholder={`Game ${store.sessions.length + 1}`} onChange={(event) => setNewName(event.target.value)} />
            </label>
            <button
              className="btn"
              onClick={() => {
                store.createSession(newName);
                setNewName("");
              }}
            >
              <Plus size={16} /> New game
            </button>
            <button
              className={`btn ${store.gameLocked ? "border-emerald-300 text-emerald-800" : "border-amber-300 text-amber-900"}`}
              onClick={() => store.setAllGamesLocked(!store.gameLocked)}
            >
              {store.gameLocked ? <Unlock size={16} /> : <Lock size={16} />} {store.gameLocked ? "Unlock all games" : "Lock all games"}
            </button>
            <button
              className="btn border-red-300 text-red-800"
              disabled={store.sessions.length <= 1}
              onClick={() => {
                if (window.confirm("Delete this classroom game session?")) store.deleteSession(store.activeSessionId);
              }}
            >
              <Trash2 size={16} /> Delete
            </button>
          </>
        )}
      </div>
    </section>
  );
}
