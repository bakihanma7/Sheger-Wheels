"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Notice } from "@/components/ui/Notice";
import {
  homeFor, safeReturnPath, signUp, validateConfirmPassword, validateEmail, validateName, validatePassword, validatePhone,
  type AccountType,
} from "@/lib/auth";
import { createCredential } from "@/lib/password";

type StepId = "name" | "email" | "phone" | "password" | "confirm" | "role" | "done";
const ORDER: StepId[] = ["name", "email", "phone", "password", "confirm", "role", "done"];
const FORM_STEPS = 6; // steps 1-6 are questions, step 7 is the hand-off to the dashboard

const CHOICES: { value: AccountType; title: string; body: string }[] = [
  { value: "owner", title: "Owner", body: "I want to list my car and earn." },
  { value: "renter", title: "Renter", body: "I want to rent cars." },
  { value: "both", title: "Owner + renter", body: "I want to do both with one account." },
];

/** Step-by-step sign-up: name → email → phone → password → confirm password → role → dashboard. */
export function SignUpClient() {
  const sp = useSearchParams();
  const [step, setStep] = useState(0);
  const [v, setV] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [error, setError] = useState("");
  const [created, setCreated] = useState<AccountType | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const id = ORDER[step];

  function check(): string | null {
    switch (id) {
      case "name": return validateName(v.name);
      case "email": return validateEmail(v.email);
      case "phone": return validatePhone(v.phone);
      case "password": return validatePassword(v.password);
      case "confirm": return validateConfirmPassword(v.password, v.confirm);
      case "role": return accountType ? null : "Choose how you'll use Sheggar Wheels.";
      default: return null;
    }
  }

  function go(to: number) {
    setStep(to);
    setError("");
    requestAnimationFrame(() => heading.current?.focus());
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const err = check();
    if (err) return setError(err);
    if (id !== "role") return go(step + 1);
    // Final question answered: create the account. Only a salted hash of the password is stored.
    const cred = await createCredential(v.password);
    const r = signUp({ name: v.name, email: v.email, phone: v.phone, accountType: accountType as AccountType, ...cred });
    if (!r.ok) {
      // e.g. the email was taken in another tab since step 2: send them back to fix it.
      setError(r.error);
      return;
    }
    setV({ ...v, password: "", confirm: "" });
    setCreated(accountType as AccountType);
    go(step + 1);
  }

  if (id === "done" && created) {
    const dest = created === "owner" ? homeFor(created) : safeReturnPath(sp.get("next"), homeFor(created));
    return (
      <div className="panel stack" role="status">
        <p className="eyebrow">Step 7 of 7</p>
        <h1 className="page-title" ref={heading} tabIndex={-1}>Welcome, {v.name.trim().split(" ")[0]}!</h1>
        <p className="page-sub">Your demo account is ready. You're signed in for this browser tab.</p>
        <div><Button href={dest} variant="primary">Go to dashboard</Button></div>
      </div>
    );
  }

  const titles: Record<StepId, { q: string; hint?: string }> = {
    name: { q: "What's your full name?" },
    email: { q: "What's your email?" },
    phone: { q: "What's your phone number?", hint: "e.g. +251 91 234 5678" },
    password: { q: "Create a password", hint: "At least 8 characters with a letter and a number." },
    confirm: { q: "Confirm your password" },
    role: { q: "Which one are you?" },
    done: { q: "" },
  };

  return (
    <div className="stack">
      <div>
        <p className="eyebrow">Step {step + 1} of {ORDER.length}</p>
        <progress className="wizard-progress" max={FORM_STEPS} value={step} aria-label="Sign-up progress" />
        <h1 className="page-title" ref={heading} tabIndex={-1}>{titles[id].q}</h1>
      </div>
      <form className="panel stack" onSubmit={onSubmit} noValidate aria-label={`Sign-up step ${step + 1}`}>
        {step === 0 && <Notice tone="info">Demo only: this account lives in this browser's storage. Don't enter anything real.</Notice>}
        {id === "name" && <Field key="name" id="name" label="Full name" autoComplete="name" autoFocus value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} error={error} />}
        {id === "email" && <Field key="email" id="email" label="Email" type="email" autoComplete="email" autoFocus value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} error={error} />}
        {id === "phone" && <Field key="phone" id="phone" label="Phone number" type="tel" autoComplete="tel" autoFocus value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} hint={titles.phone.hint} error={error} />}
        {id === "password" && (
          <>
            <Field key="password" id="password" label="Password" type="password" autoComplete="new-password" autoFocus value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} hint={titles.password.hint} error={error} />
            <Notice tone="warn">Demo note: your password is saved only as a salted hash in this browser's storage. Don't reuse a real password.</Notice>
          </>
        )}
        {id === "confirm" && <Field key="confirm" id="confirm" label="Confirm password" type="password" autoComplete="new-password" autoFocus value={v.confirm} onChange={(e) => setV({ ...v, confirm: e.target.value })} error={error} />}
        {id === "role" && (
          <fieldset className="choice-grid">
            <legend className="sr-only">Account type</legend>
            {CHOICES.map((c) => (
              <label key={c.value} className={`choice${accountType === c.value ? " choice--on" : ""}`}>
                <input type="radio" name="accountType" value={c.value} checked={accountType === c.value} onChange={() => { setAccountType(c.value); setError(""); }} />
                <span className="choice__title">{c.title}</span>
                <span className="choice__body">{c.body}</span>
              </label>
            ))}
            {error && <p className="field__error" role="alert">{error}</p>}
          </fieldset>
        )}
        <div className="row row--between">
          {step > 0 ? <Button type="button" variant="ghost" onClick={() => go(step - 1)}>← Back</Button> : <span />}
          <Button type="submit" variant="primary">{id === "role" ? "Create account" : "Continue"}</Button>
        </div>
        <p className="muted small">Already have a demo account? <Link href="/signin"><u>Sign in</u></Link></p>
      </form>
    </div>
  );
}
