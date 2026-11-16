function FieldShell({ id, label, hint, error, required, children }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-1 text-critical" aria-hidden="true">*</span>}
      </label>
      {children}
      {(error || hint) && (
        <p
          id={`${id}-message`}
          className={`text-xs leading-5 ${error ? "text-critical" : "text-muted"}`}
          role={error ? "alert" : undefined}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}

const controlStyles =
  "w-full rounded-lg border bg-white px-3 text-sm text-ink placeholder:text-slate-400 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function TextInput({ id, label, hint, error, required, className = "", ...props }) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={`${controlStyles} min-h-11 border-line ${error ? "border-critical" : ""} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

export function SelectInput({
  id,
  label,
  hint,
  error,
  required,
  children,
  className = "",
  ...props
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <select
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={`${controlStyles} min-h-11 border-line ${error ? "border-critical" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
}

export function TextArea({
  id,
  label,
  hint,
  error,
  required,
  className = "",
  ...props
}) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={`${controlStyles} min-h-28 resize-y border-line py-3 ${error ? "border-critical" : ""} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}
