"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputCls =
  "w-full rounded-lg border border-line bg-ink-3 px-4 py-3 text-ash placeholder:text-ash-3 outline-none transition-colors focus:border-fire/60";
const primaryBtn =
  "font-display w-full rounded-lg bg-fire px-6 py-3 text-lg tracking-wide text-white transition-colors hover:bg-fire-2 disabled:opacity-60";
const ghostBtn =
  "w-full rounded-lg border border-line px-6 py-3 text-ash-2 transition-colors hover:border-fire/50 hover:text-ash disabled:opacity-60";

type Method = "phone" | "email";

export function AuthForm() {
  const router = useRouter();
  const supabase = createClient();

  const [method, setMethod] = useState<Method>("email");
  const [otpSent, setOtpSent] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  function reset() {
    setError("");
    setInfo("");
  }
  function done() {
    router.push("/account");
    router.refresh();
  }

  async function sendPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.trim() });
    setLoading(false);
    if (error) return setError(error.message);
    setOtpSent(true);
    setInfo(`We sent a 6-digit code to ${phone.trim()}.`);
  }

  async function verifyPhoneOtp(e: React.FormEvent) {
    e.preventDefault();
    reset();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone.trim(),
      token: otp.trim(),
      type: "sms",
    });
    setLoading(false);
    if (error) return setError(error.message);
    done();
  }

  async function emailAuth(mode: "login" | "signup") {
    reset();
    setLoading(true);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (result.error) return setError(result.error.message);
    if (mode === "signup" && !result.data.session) {
      return setInfo("Check your email to confirm your account, then log in.");
    }
    done();
  }

  return (
    <div>
      <div className="mb-5 flex gap-2 rounded-lg border border-line p-1">
        {(["email", "phone"] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMethod(m);
              setOtpSent(false);
              reset();
            }}
            className={
              "flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors " +
              (method === m ? "bg-fire/15 text-fire" : "text-ash-2 hover:text-ash")
            }
          >
            {m === "phone" ? "Phone OTP" : "Email"}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}
      {info && (
        <p className="mb-4 rounded-lg border border-fire/30 bg-fire/10 px-4 py-2 text-sm text-fire">
          {info}
        </p>
      )}

      {method === "phone" ? (
        !otpSent ? (
          <form onSubmit={sendPhoneOtp} className="space-y-4">
            <input
              className={inputCls}
              type="tel"
              required
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button className={primaryBtn} disabled={loading}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyPhoneOtp} className="space-y-4">
            <input
              className={inputCls}
              type="text"
              inputMode="numeric"
              required
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button className={primaryBtn} disabled={loading}>
              {loading ? "Verifying…" : "Verify & continue"}
            </button>
            <button
              type="button"
              className={ghostBtn}
              onClick={() => {
                setOtpSent(false);
                reset();
              }}
            >
              Change number
            </button>
          </form>
        )
      ) : (
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <input
            className={inputCls}
            type="email"
            required
            placeholder="Email address"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className={inputCls}
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 characters)"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              className={primaryBtn}
              disabled={loading}
              onClick={() => emailAuth("login")}
            >
              {loading ? "…" : "Log in"}
            </button>
            <button
              type="button"
              className={ghostBtn}
              disabled={loading}
              onClick={() => emailAuth("signup")}
            >
              Create account
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
