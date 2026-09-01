import { Copy, Layers3, Lock, Plus, Trash2, Unlock, Users } from "lucide-react";
import { useState } from "react";
import { getPermissions } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";

export default function SessionSwitcher() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const [newName, setNewName] = useState("");
  const [copied, setCopied] = useState(false);

  const codeList = store.sessions.map((session) => `${session.name}: ${session.code}`).join("\n");

  return (
    <section className="panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-lg font-black">
            <Layers3 size={20} /> Classroom Games
          </div>
          <p className="text-sm text-slate-600">Create one game per student group, hand out the join code, then jump between groups here.</p>
        </div>
        {permissions.canViewTeacherTools && (
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => store.createClassroomGames(5)}>
              <Users size={16} /> Set up 5 group games
            </button>
            <button
              className="btn"
              onClick={() => {
                void navigator.clipboard?.writeText(codeList);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              }}
            >
              <Copy size={16} /> {copied ? "Copied" : "Copy codes"}
            </button>
          </div>
        )}
      </div>
      <div className="mb-3 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
        <div className="border border-slate-200 bg-white p-2" style={{ borderRadius: 8 }}>
          <span className="font-black">1.</span> Make groups.
        </div>
        <div className="border border-slate-200 bg-white p-2" style={{ borderRadius: 8 }}>
          <span className="font-black">2.</span> Give students their code.
        </div>
        <div className="border border-slate-200 bg-white p-2" style={{ borderRadius: 8 }}>
          <span className="font-black">3.</span> Use this panel to control each game.
        </div>
      </div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <label className="min-w-56 flex-1">
          <span className="mb-1 block text-xs font-black uppercase text-slate-500">Jump to game</span>
          <select className="input" value={store.activeSessionId} onChange={(event) => store.switchSession(event.target.value)}>
            {store.sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name} - {session.code} {session.state.gameLocked ? "(locked)" : ""}
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
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {store.sessions.map((session) => {
          const active = session.id === store.activeSessionId;
          return (
            <button
              key={session.id}
              className={`border p-3 text-left ${active ? "border-blue-700 bg-blue-50" : "border-slate-200 bg-white"}`}
              style={{ borderRadius: 8 }}
              onClick={() => store.switchSession(session.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-black">{session.name}</div>
                  <div className="text-xs font-semibold text-slate-600">
                    {session.state.phase} / {session.state.currentMonth}
                  </div>
                </div>
                {session.state.gameLocked && <Lock size={16} className="text-amber-700" />}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="border border-slate-300 bg-white px-3 py-1 font-mono text-lg font-black tracking-widest" style={{ borderRadius: 6 }}>
                  {session.code}
                </span>
                <span className="text-xs font-bold text-slate-600">
                  <Copy size={13} className="inline" /> join code
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
