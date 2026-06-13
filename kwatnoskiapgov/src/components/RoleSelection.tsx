import type { UserRole } from "../lib/permissions";
import { ClipboardCheck, GraduationCap, Landmark, MonitorUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const roles: Array<{ role: UserRole; title: string; description: string; Icon: LucideIcon; tone: string }> = [
  {
    role: "teacher",
    title: "Teacher Mode",
    description: "Setup, convention, election night, imports, exports, and teacher-only decisions.",
    Icon: Landmark,
    tone: "bg-blue-700 text-white"
  },
  {
    role: "scorekeeper",
    title: "Scorekeeper Mode",
    description: "Fast token updates, card effects, primary previews, notes, and action logging.",
    Icon: ClipboardCheck,
    tone: "bg-red-700 text-white"
  },
  {
    role: "student",
    title: "Student Candidate View",
    description: "Candidate strengths, delegate totals, target groups, and recent changes.",
    Icon: GraduationCap,
    tone: "bg-slate-900 text-white"
  },
  {
    role: "monitor",
    title: "Class Monitor View",
    description: "Projector scoreboard for phase, month, delegates, voter groups, and results.",
    Icon: MonitorUp,
    tone: "bg-white text-blue-900 border border-blue-200"
  }
];

export default function RoleSelection({ onChooseRole }: { onChooseRole: (role: UserRole) => void }) {
  return (
    <main className="min-h-screen bg-classroom px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 border-b border-slate-200 pb-6">
          <div className="mode-badge mb-4">
            <Landmark size={18} /> AP Government Simulation
          </div>
          <h1 className="text-5xl font-black text-ink">Election Control Center</h1>
          <p className="mt-2 text-xl font-semibold text-slate-700">Choose the classroom view you need.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {roles.map((item) => (
            <button
              key={item.role}
              className="role-card"
              onClick={() => onChooseRole(item.role)}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center ${item.tone}`} style={{ borderRadius: 8 }}>
                <item.Icon size={26} />
              </div>
              <div className="text-2xl font-black text-slate-950">{item.title}</div>
              <div className="mt-2 text-base text-slate-700">{item.description}</div>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
