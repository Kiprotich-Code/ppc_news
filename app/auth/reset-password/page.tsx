"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [validating, setValidating] = useState(true);
  const [emailMasked, setEmailMasked] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setErr("Missing token");
      setValidating(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setErr("Invalid or expired link");
        } else {
          setEmailMasked(data.emailMasked);
        }
      } catch {
        setErr("Validation failed");
      } finally {
        setValidating(false);
      }
    })();
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setDone(true);
      setTimeout(() => router.push("/auth/signin"), 2000);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
      {validating ? (
        <p className="text-sm">Validating link...</p>
      ) : err && !done ? (
        <p className="text-red-600 text-sm">{err}</p>
      ) : done ? (
        <p className="text-green-600 text-sm">Password updated. Redirecting...</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {emailMasked && (
            <p className="text-xs text-gray-500">
              Resetting password for: <span className="font-mono">{emailMasked}</span>
            </p>
          )}
          <input
            type="password"
            minLength={6}
            required
            className="w-full border px-3 py-2 rounded"
            placeholder="New password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
            <input
            type="password"
            minLength={6}
            required
            className="w-full border px-3 py-2 rounded"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            {submitting ? "Updating..." : "Reset password"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="max-w-sm mx-auto py-12">
        <h1 className="text-xl font-semibold mb-4">Reset Password</h1>
        <p className="text-sm">Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
