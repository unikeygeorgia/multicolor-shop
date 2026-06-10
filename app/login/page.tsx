"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { useStore } from "@/components/store-provider";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7C43.9 38 46.5 31.8 46.5 24.5z" />
      <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.7c-2 1.4-4.6 2.2-8.6 2.2-6.4 0-11.7-3.7-13.6-9.4l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function LoginPage() {
  const { user, ready, signInPassword, signUpPassword, signInGoogle, sendPhoneOtp, verifyPhoneOtp } =
    useAuth();
  const { settings, hydrated } = useStore();
  const router = useRouter();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  /* phone otp */
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (hydrated && !settings.commerceEnabled) router.replace("/");
    else if (ready && user) router.replace("/account");
  }, [hydrated, settings.commerceEnabled, ready, user, router]);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr(null); setOk(null);
    if (mode === "in") {
      const { error } = await signInPassword(email.trim(), password);
      if (error) setErr(error);
      else router.replace("/account");
    } else {
      const { error, needsConfirm } = await signUpPassword(email.trim(), password, { name: name.trim() });
      if (error) setErr(error);
      else if (needsConfirm) setOk("ანგარიში შეიქმნა — შესვლის დასადასტურებლად იხილეთ ელფოსტა.");
      else router.replace("/account");
    }
    setBusy(false);
  };

  const google = async () => {
    setErr(null);
    const { error } = await signInGoogle();
    if (error) setErr(error);
  };

  const sendOtp = async () => {
    setBusy(true); setErr(null); setOk(null);
    const { error } = await sendPhoneOtp(phone.trim());
    if (error) setErr(error);
    else { setOtpSent(true); setOk("კოდი გამოგზავნილია SMS-ით."); }
    setBusy(false);
  };
  const verifyOtp = async () => {
    setBusy(true); setErr(null);
    const { error } = await verifyPhoneOtp(phone.trim(), otp.trim());
    if (error) setErr(error);
    else router.replace("/account");
    setBusy(false);
  };

  if (!hydrated || !settings.commerceEnabled) {
    return <main className="wrap" style={{ minHeight: "60vh" }} />;
  }

  return (
    <main className="wrap" data-screen-label="ავტორიზაცია">
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>{mode === "in" ? "შესვლა" : "რეგისტრაცია"}</h1>
          <p className="lead">
            {mode === "in"
              ? "შედი ანგარიშზე შეკვეთების სანახავად."
              : "შექმენი ანგარიში — შეუკვეთე უფრო სწრაფად."}
          </p>

          <div className="auth-tabs">
            <button className={mode === "in" ? "on" : ""} onClick={() => { setMode("in"); setErr(null); setOk(null); }}>შესვლა</button>
            <button className={mode === "up" ? "on" : ""} onClick={() => { setMode("up"); setErr(null); setOk(null); }}>რეგისტრაცია</button>
          </div>

          {err && <div className="auth-err" style={{ marginBottom: 14 }}>{err}</div>}
          {ok && <div className="auth-ok" style={{ marginBottom: 14 }}>{ok}</div>}

          <form className="auth-form" onSubmit={submitEmail}>
            {mode === "up" && (
              <div className="field">
                <label htmlFor="lg-name">სახელი</label>
                <input id="lg-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="სახელი, გვარი" />
              </div>
            )}
            <div className="field">
              <label htmlFor="lg-email">ელფოსტა *</label>
              <input id="lg-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="field">
              <label htmlFor="lg-pass">პაროლი *</label>
              <input id="lg-pass" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="მინ. 6 სიმბოლო" />
            </div>
            <button className="btn lg" type="submit" disabled={busy}>
              {busy ? "..." : mode === "in" ? "შესვლა" : "ანგარიშის შექმნა"}
            </button>
          </form>

          <div className="auth-divider">ან</div>

          <button className="oauth-btn" onClick={google} type="button">
            <GoogleIcon /> გაგრძელება Google-ით
          </button>

          <div style={{ marginTop: 14 }}>
            {!otpSent ? (
              <div className="field">
                <label htmlFor="lg-phone">ტელეფონით შესვლა</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id="lg-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+995 5__ __ __ __" />
                  <button className="btn-line" type="button" onClick={sendOtp} disabled={busy || !phone.trim()}>კოდი</button>
                </div>
              </div>
            ) : (
              <div className="field">
                <label htmlFor="lg-otp">SMS კოდი</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id="lg-otp" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-ნიშნა კოდი" />
                  <button className="btn" type="button" onClick={verifyOtp} disabled={busy || !otp.trim()}>დადასტურება</button>
                </div>
              </div>
            )}
          </div>

          <p className="auth-note" style={{ marginTop: 16 }}>
            Google და ტელეფონით შესვლა მუშაობს მას შემდეგ, რაც Supabase-ში ჩაირთვება შესაბამისი
            პროვაიდერი (Google OAuth / SMS).
          </p>

          <div className="auth-alt">
            <Link href="/shop">← კატალოგზე დაბრუნება</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
