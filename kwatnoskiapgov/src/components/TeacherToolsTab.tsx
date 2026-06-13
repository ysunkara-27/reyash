import { useRef, useState } from "react";
import DataIssuesPanel from "./DataIssuesPanel";
import { dataIssues, useGameStore } from "../store/gameStore";
import { downloadTextFile } from "../lib/storage";
import { electionResultsToCsv, gameSummaryToCsv } from "../lib/exportCsv";
import type { SerializableGameState } from "../types";
import { getPermissions } from "../lib/permissions";
import { setTeacherPassword } from "../lib/teacherAuth";
import { Download, FileJson, KeyRound, RotateCcw, Save, ShieldCheck, Trash2, Upload } from "lucide-react";

export default function TeacherToolsTab() {
  const store = useGameStore();
  const permissions = getPermissions(store.activeRole);
  const fileRef = useRef<HTMLInputElement>(null);
  const [newPassword, setNewPassword] = useState("");
  const json = JSON.stringify(store.serializable(), null, 2);
  const manualSaveKey = "election-control-center-manual-save";

  return (
    <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="panel space-y-3">
        <h2 className="text-2xl font-black">Teacher Tools</h2>
        <div className="text-sm text-slate-700">Autosave status: {store.autosaveAt ? `saved at ${store.autosaveAt}` : "ready"}</div>
        <div className="grid gap-2 border-t border-slate-200 pt-3">
          <div className="text-sm font-black uppercase text-slate-500">Save and move data</div>
          <button
            className="btn"
            disabled={!permissions.canImportExport}
            onClick={() => {
              localStorage.setItem(manualSaveKey, json);
              store.recordAction("Manual browser save.", "canImportExport");
            }}
          >
            <Save size={16} /> Save game
          </button>
          <button
            className="btn"
            disabled={!permissions.canImportExport}
            onClick={() => {
              const saved = localStorage.getItem(manualSaveKey);
              if (!saved) return;
              try {
                store.importGame(JSON.parse(saved) as SerializableGameState);
              } catch {
                store.recordAction("Load failed: invalid browser save.", "canImportExport");
              }
            }}
          >
            <Upload size={16} /> Load game
          </button>
          <button className="btn" disabled={!permissions.canImportExport} onClick={() => downloadTextFile("election-control-center.json", json, "application/json")}>
            <FileJson size={16} /> Export JSON
          </button>
          <button className="btn" disabled={!permissions.canImportExport} onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import JSON
          </button>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              file
                .text()
                .then((text) => {
                  if (window.confirm("Import this JSON game state? It will replace the current game.")) {
                    store.importGame(JSON.parse(text) as SerializableGameState);
                  }
                })
                .catch(() => store.recordAction("Import failed: invalid JSON.", "canImportExport"));
            }}
          />
          <button className="btn" disabled={!permissions.canImportExport} onClick={() => downloadTextFile("election-results.csv", electionResultsToCsv(store.electionResults), "text/csv")}>
            <Download size={16} /> Export results CSV
          </button>
          <button className="btn" disabled={!permissions.canImportExport} onClick={() => downloadTextFile("game-summary.csv", gameSummaryToCsv(store.serializable()), "text/csv")}>
            <Download size={16} /> Export summary CSV
          </button>
        </div>
        <div className="grid gap-2 border-t border-slate-200 pt-3">
          <div className="text-sm font-black uppercase text-slate-500">Admin actions</div>
          <button className="btn" onClick={store.undo} disabled={!permissions.canUndo}>
            <RotateCcw size={16} /> Undo last action
          </button>
          <button
            className="btn"
            disabled={!permissions.canViewTeacherTools}
            onClick={() => {
              if (window.confirm("Clear the full action log?")) store.clearActionLog();
            }}
          >
            <Trash2 size={16} /> Clear action log
          </button>
          <button className="btn" onClick={() => store.recordAction("Validated seeded data.", "canViewTeacherTools")} disabled={!permissions.canViewTeacherTools}>
            <ShieldCheck size={16} /> Validate data
          </button>
          <button
            className="btn border-red-300 text-red-800"
            disabled={!permissions.canResetGame}
            onClick={() => {
              if (window.confirm("Reset the entire game? This cannot be undone from the current game state.")) store.resetGame();
            }}
          >
            <Trash2 size={16} /> Reset game
          </button>
        </div>
        <div className="border-t border-slate-200 pt-3">
          <h3 className="mb-2 flex items-center gap-2 text-lg font-black"><KeyRound size={18} /> Teacher Password</h3>
          <div className="flex gap-2">
            <input
              className="input"
              type="password"
              placeholder="New teacher password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <button
              className="btn"
              disabled={!newPassword.trim() || !permissions.canViewTeacherTools}
              onClick={() => {
                setTeacherPassword(newPassword);
                setNewPassword("");
                store.recordAction("Changed teacher password.", "canViewTeacherTools");
              }}
            >
              Change
            </button>
          </div>
        </div>
        <DataIssuesPanel issues={dataIssues} />
      </section>

      <section className="panel">
        <h2 className="mb-3 text-2xl font-black">Action Log</h2>
        <div className="max-h-[620px] overflow-y-auto">
          {[...store.actionLog].reverse().map((entry) => (
            <div key={entry.id} className="border-b border-slate-100 py-2 text-sm">
              <div className="font-bold">{entry.message}</div>
              <div className="text-slate-600">{new Date(entry.at).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
