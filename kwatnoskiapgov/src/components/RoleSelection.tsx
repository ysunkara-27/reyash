import { useState } from "react";
import { ArrowRight, GraduationCap, Landmark, MonitorUp, Route } from "lucide-react";
import type { UserRole } from "../lib/permissions";
import { useGameStore } from "../store/gameStore";

export default function RoleSelection({ onChooseRole }: { onChooseRole: (role: UserRole) => void }) {
  const joinSessionByCode = useGameStore((state) => state.joinSessionByCode);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");

  const joinGame = () => {
    const joined = joinSessionByCode(joinCode);
    setJoinError(joined ? "" : "No classroom game found for that code on this browser.");
  };

  return (
    <main className="min-h-screen bg-classroom px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="mode-badge mb-4">
            <Landmark size={18} /> AP Government Simulation
          </div>
          <h1 className="text-5xl font-black text-ink">Election Control Center</h1>
          <p className="mt-2 text-xl font-semibold text-slate-700">Teacher control center plus student game-code access.</p>
        </div>

        <section className="mb-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="panel border-blue-200 bg-blue-50">
            <div className="mb-4 flex h-12 w-12 items-center justify-center bg-blue-700 text-white" style={{ borderRadius: 8 }}>
              <GraduationCap size={28} />
            </div>
            <h2 className="text-3xl font-black text-blue-950">Student: Join Your Game</h2>
            <p className="mt-1 text-sm text-blue-950">
              Enter the group code from your teacher. Then choose your candidate inside the student dashboard.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <input
                className="input max-w-56 text-lg font-black uppercase tracking-widest"
                value={joinCode}
                placeholder="ABCDE"
                maxLength={8}
                onChange={(event) => {
                  setJoinCode(event.target.value.toUpperCase());
                  setJoinError("");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") joinGame();
                }}
              />
              <button className="btn btn-primary" onClick={joinGame}>
                Join Game
              </button>
            </div>
            {joinError && <div className="mt-2 text-sm font-bold text-red-700">{joinError}</div>}
          </div>

          <div className="grid gap-4">
            <button className="role-card" onClick={() => onChooseRole("teacher")}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center bg-blue-900 text-white" style={{ borderRadius: 8 }}>
                <Landmark size={28} />
              </div>
              <div className="text-2xl font-black text-slate-950">Teacher Control Center</div>
              <div className="mt-2 text-base text-slate-700">
                Create group games, see all codes, switch between groups, lock games, and run the election.
              </div>
            </button>
            <button className="role-card" onClick={() => onChooseRole("monitor")}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center border border-blue-200 bg-white text-blue-900" style={{ borderRadius: 8 }}>
                <MonitorUp size={28} />
              </div>
              <div className="text-2xl font-black text-slate-950">Class Monitor</div>
              <div className="mt-2 text-base text-slate-700">Projector view that cycles through the active classroom games.</div>
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel">
            <div className="mb-3 flex items-center gap-2 text-xl font-black">
              <Route size={22} /> How Class Should Use This
            </div>
            <div className="space-y-3 text-sm leading-6 text-slate-700">
              <p>
                The teacher opens <span className="font-bold">Teacher Control Center</span>, creates one game for each group,
                and gives each group its join code.
              </p>
              <p>
                Students enter their group code here and use the read-only candidate dashboard. The teacher keeps one control
                center open to update tokens, run primaries, manage conventions, and calculate Election Night.
              </p>
              <p>
                Game flow: <span className="font-bold">Setup</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">Primaries</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">Convention</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">General Election</span> <ArrowRight className="inline" size={14} />{" "}
                <span className="font-bold">Election Night</span>.
              </p>
            </div>
          </div>
          <div className="panel">
            <div className="mb-3 text-xl font-black">Important Classroom Note</div>
            <p className="text-sm leading-6 text-slate-700">
              This is still a lightweight no-backend app. Game codes connect to the classroom games saved in this browser’s
              workspace. For live syncing across every student’s personal device, the app would need a real backend or realtime
              database.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
