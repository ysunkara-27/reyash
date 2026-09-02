'use client';

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background bg-grid flex items-center justify-center p-6">
      <form action="/api/auth/login" method="post" className="retro-card border-retro-pink p-10 w-full max-w-xl text-center">
        <p className="font-[family-name:var(--font-pixel)] text-sm text-retro-pink tracking-widest mb-6">✨ UX STUDIO ✨</p>
        <h1 className="font-[family-name:var(--font-retro)] text-5xl text-white glow-text mb-6">Office Hours</h1>
        <p className="font-[family-name:var(--font-mono)] text-white/60 mb-8">Enter the access password to continue.</p>
        <label className="sr-only" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required autoFocus className="w-full bg-black/40 border-2 border-retro-pink p-4 text-center text-xl text-white font-[family-name:var(--font-mono)] outline-none" />
        <button type="submit" className="mt-6 w-full bg-retro-pink text-black py-4 font-[family-name:var(--font-pixel)] text-sm hover:scale-[1.02] transition-transform">ENTER OFFICE HOURS</button>
      </form>
    </main>
  );
}
