import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Common = { label: string; id: string; error?: string; hint?: string };

function Wrap({ id, label, error, hint, children }: Common & { children: ReactNode }) {
  return (
    <div>
      <label className={`field${error ? " field--error" : ""}`} htmlFor={id}>
        <span className="field__label">{label}</span>
        {children}
      </label>
      {hint && !error && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field__error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

const describe = (id: string, error?: string, hint?: string) => (error ? `${id}-error` : hint ? `${id}-hint` : undefined);

/** Figma "Input / default": label on top, value below, in one bordered box. */
export function Field({ label, id, error, hint, ...rest }: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <input id={id} name={id} className="field__control" aria-invalid={!!error} aria-describedby={describe(id, error, hint)} {...rest} />
    </Wrap>
  );
}

export function SelectField({ label, id, error, hint, children, ...rest }: Common & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <select id={id} name={id} className="field__control" aria-invalid={!!error} aria-describedby={describe(id, error, hint)} {...rest}>
        {children}
      </select>
    </Wrap>
  );
}

export function TextAreaField({ label, id, error, hint, ...rest }: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Wrap id={id} label={label} error={error} hint={hint}>
      <textarea id={id} name={id} className="field__control" aria-invalid={!!error} aria-describedby={describe(id, error, hint)} {...rest} />
    </Wrap>
  );
}
