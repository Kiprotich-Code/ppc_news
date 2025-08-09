"use client";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devInfo, setDevInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(true); // toggle off in production

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setDevInfo(null);
    try {
      const res = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, dev: devMode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSent(true);
      if (devMode) setDevInfo(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-xl font-semibold mb-4">Forgot Password</h1>
      {sent ? (
        <div className="space-y-2">
          <p className="text-sm text-green-600">If that email exists, a reset link was generated.</p>
          {devInfo?.resetLink && (
            <p className="text-xs break-all">
              Dev reset link: <a className="text-blue-600 underline" href={devInfo.resetLink}>{devInfo.resetLink}</a>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full border px-3 py-2 rounded"
            placeholder="you@example.com"
            type="email"
            value={email}
            required
            onChange={e => setEmail(e.target.value)}
          />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <div className="flex items-center gap-2 text-xs">
            <input
              id="devMode"
              type="checkbox"
              checked={devMode}
              onChange={e => setDevMode(e.target.checked)}
            />
            <label htmlFor="devMode">Dev mode (show link)</label>
          </div>
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </div>
  );
}
