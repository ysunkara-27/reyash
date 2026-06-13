import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { unlockTeacher } from "../lib/teacherAuth";

export default function TeacherLogin({ onUnlocked, onSwitchRole }: { onUnlocked: () => void; onSwitchRole: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  return (
    <main className="min-h-screen bg-classroom px-4 py-8">
      <section className="panel mx-auto max-w-md space-y-4">
        <div>
          <div className="mb-3 flex h-12 w-12 items-center justify-center bg-blue-700 text-white" style={{ borderRadius: 8 }}>
            <LockKeyhole size={26} />
          </div>
          <h1 className="text-3xl font-black">Teacher Mode</h1>
          <p className="text-sm text-slate-700">Enter the classroom password to unlock administrative controls.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-bold">Password</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                if (unlockTeacher(password)) onUnlocked();
                else setError("Password did not match.");
              }
            }}
          />
        </label>
        {error && <div className="text-sm font-bold text-red-700">{error}</div>}
        <div className="flex gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              if (unlockTeacher(password)) onUnlocked();
              else setError("Password did not match.");
            }}
          >
            Unlock
          </button>
          <button className="btn" onClick={onSwitchRole}>
            Switch Role
          </button>
        </div>
      </section>
    </main>
  );
}
