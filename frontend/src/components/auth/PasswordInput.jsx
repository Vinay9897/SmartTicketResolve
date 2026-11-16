import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextInput } from "../ui/FormField.jsx";

export default function PasswordInput({ id, label, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <TextInput
        autoComplete={props.autoComplete}
        className="pr-11"
        id={id}
        label={label}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
        className="absolute right-2 top-8 grid size-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        {visible
          ? <EyeOff aria-hidden="true" className="size-4" />
          : <Eye aria-hidden="true" className="size-4" />}
      </button>
    </div>
  );
}
