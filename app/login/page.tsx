"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Lock, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") || "/builder";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!password) return;
    setBusy(true);
    setError("");
    const t0 = performance.now();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed.");
      const total = Math.round(performance.now() - t0);
      console.log(`[auth] login round trip ${total}ms (server ${data.serverMs}ms), navigating…`);
      // Hard navigation: bypasses the client router cache and guarantees the
      // fresh session cookie is sent on the next request.
      window.location.assign(next);
    } catch (e: any) {
      setError(e.message ?? "Login failed.");
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <span className="font-display text-xl font-bold tracking-tight">
          Resume<span className="text-signal">Forge</span>
        </span>
      </div>
      <div className="rounded-2xl border border-hairline bg-white p-6 shadow-sheet">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-signal/10">
            <Lock size={15} className="text-signal" />
          </span>
          <div>
            <h1 className="font-display text-sm font-bold">Private workspace</h1>
            <p className="text-xs text-slate2">This deployment is owner-only.</p>
          </div>
        </div>

        <label className="label" htmlFor="pw">
          Password
        </label>
        <input
          id="pw"
          type="password"
          className="field"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        {error && (
          <p className="mt-2 text-xs text-coral" role="alert">
            {error}
          </p>
        )}
        <button
          className="btn-primary mt-4 w-full text-sm"
          onClick={submit}
          disabled={busy || !password}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
          {busy ? "Signing in…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-paper px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
