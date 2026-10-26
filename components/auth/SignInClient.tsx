"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import { landingFor, safeReturnPath, signInAsDemo, signInWithPassword, signOut, validateIdentifier } from "@/lib/auth";
import { useSession, useUsers } from "@/lib/hooks";
import { DEMO_PASSWORD } from "@/lib/seed";
import type { User } from "@/lib/types";

/** Two steps, as sketched: (1) email or phone number, (2) password. */
export function SignInClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const session = useSession();
  const users = useUsers();
  const [step, setStep] = useState(0);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const rawNext = sp.get("next");
  const next = safeReturnPath(rawNext, "");
  const unsafe = !!rawNext && !next;

  function finish(u: User) {
    // Only same-site paths are honoured; anything else (e.g. https://example.com) goes to the user's home.
    const dest = rawNext ? safeReturnPath(rawNext, landingFor(u)) : landingFor(u);
    router.replace(dest);
  }

  function go(to: number) {
    setStep(to);
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (step === 0) {
      const err = validateIdentifier(identifier);
      if (err) return setError(err);
      return go(1);
    }
    setBusy(true);
    const r = await signInWithPassword(identifier, password);
    setBusy(false);
    if (!r.ok) return setError(r.error);
    setPassword("");
    finish(r.data);
  }

  function pick(id: string) {
    const r = signInAsDemo(id);
    if (!r.ok) return setError(r.error);
    finish(r.data);
  }

  const demoUsers = users.filter((u) => u.email.endsWith("@demo.sheggar.test"));
  const labelFor = (u: User) => (u.roles.includes("admin") ? "Admin (seeded demo account)" : u.status === "suspended" ? "Suspended renter (to see the blocked state)" : u.roles.includes("owner") ? "Owner + renter" : "Renter");

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Step {step + 1} of 2</p>
        <progress className="wizard-progress" max={2} value={step} aria-label="Sign-in progress" />
        <h1 className="page-title" ref={heading} tabIndex={-1}>{step === 0 ? "Welcome back" : "Enter your password"}</h1>
        <p className="page-sub">{step === 0 ? "Sign in with your email or phone number." : <>Signing in as <strong>{identifier.trim()}</strong>.</>}</p>
      </div>
      {next && <Notice tone="info" title="Please sign in to continue.">You'll go back to <code>{next}</code> afterwards.</Notice>}
      {unsafe && <Notice tone="warn" title="Ignored an unsafe return address.">After signing in you'll land on your home page instead.</Notice>}
      {session.status === "signed-in" && (
        <Notice tone="success" title={`You're signed in as ${session.user.name}.`}>
          <Link href={next || landingFor(session.user)}>Continue</Link> or <button type="button" className="btn btn--secondary" style={{ minHeight: 0, padding: 0 }} onClick={() => signOut()}>sign out</button>.
        </Notice>
      )}
      <form className="panel stack" onSubmit={onSubmit} noValidate aria-label={`Sign-in step ${step + 1}`}>
        {step === 0 ? (
          <Field key="identifier" id="identifier" label="Email or phone number" autoComplete="username" autoFocus value={identifier} onChange={(e) => setIdentifier(e.target.value)} error={error} hint="e.g. hana@demo.sheggar.test or +251 91 100 0003" />
        ) : (
          <Field key="password" id="password" label="Password" type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        )}
        <div className="row row--between">
          {step > 0 ? <Button type="button" variant="ghost" onClick={() => go(0)}>← Change email/phone</Button> : <span />}
          <Button type="submit" variant="primary" disabled={busy}>{step === 0 ? "Continue" : busy ? "Signing in…" : "Sign in"}</Button>
        </div>
        <p className="muted small">New here? <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}><u>Create a demo account</u></Link></p>
      </form>
      <section className="stack stack--sm" aria-labelledby="demo-accounts">
        <h2 id="demo-accounts" className="h3">Or pick a demo account</h2>
        <p className="muted small">Seeded demo accounts use the password <code>{DEMO_PASSWORD}</code>. These shortcuts skip the password entirely (demo convenience only).</p>
        {demoUsers.length === 0 && <p className="muted small">Loading demo accounts…</p>}
        {demoUsers.map((u) => (
          <button key={u.id} type="button" className="panel row row--between" style={{ textAlign: "left", width: "100%", minHeight: 64 }} onClick={() => pick(u.id)}>
            <span><strong>{u.name}</strong><br /><span className="muted small">{labelFor(u)}</span></span>
            <span aria-hidden="true">→</span>
          </button>
        ))}
      </section>
    </div>
  );
}
