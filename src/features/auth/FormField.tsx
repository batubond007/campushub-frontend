import { useState, type InputHTMLAttributes, type ReactNode } from 'react'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string
  hint?: ReactNode
}

/** Labelled input with an optional hint and error message, wired up for screen readers. */
export function FormField({ id, label, error, hint, ...input }: FormFieldProps) {
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...input} />
      {hint && <div id={`${id}-hint`} className="form-hint">{hint}</div>}
      {error && <p id={`${id}-error`} className="form-error">{error}</p>}
    </div>
  )
}

/** Password input with a Show / Hide toggle. */
export function PasswordField({ id, label, error, hint, ...input }: Omit<FormFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  const describedBy = [hint ? `${id}-hint` : '', error ? `${id}-error` : ''].filter(Boolean).join(' ') || undefined
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-input">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...input}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-controls={id}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && <div id={`${id}-hint`} className="form-hint">{hint}</div>}
      {error && <p id={`${id}-error`} className="form-error">{error}</p>}
    </div>
  )
}
