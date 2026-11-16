import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth.js";
import { roleOptions } from "./roleNavigation.js";

export default function UserProfileDropdown({ role, user }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const roleLabel = roleOptions.find((option) => option.value === role)?.label ?? "Preview";
  const displayName = user?.name ?? "Preview account";

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        aria-controls="profile-popover"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`${user ? "User menu" : "Preview account"}, ${roleLabel}`}
        className="flex min-h-10 items-center gap-2 rounded-lg p-1.5 pr-2 transition-colors hover:bg-slate-50"
        onClick={() => setOpen((isOpen) => !isOpen)}
        type="button"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-100 text-brand-700">
          <UserRound aria-hidden="true" className="size-4" />
        </span>
        <span className="hidden text-left sm:block">
          <span className="block max-w-28 truncate text-xs font-semibold text-ink">{displayName}</span>
          <span className="block max-w-28 truncate text-[10px] text-muted">{roleLabel}</span>
        </span>
        <ChevronDown aria-hidden="true" className="hidden size-3.5 text-muted sm:block" />
      </button>
      {open && (
        <div
          aria-labelledby="profile-popover-title"
          className="absolute right-0 top-full z-30 mt-2 w-64 rounded-xl border border-line bg-white p-2 shadow-lg"
          id="profile-popover"
          role="dialog"
        >
          <div className="border-b border-line px-3 py-3">
            <p className="text-sm font-semibold text-ink" id="profile-popover-title">{displayName}</p>
            <p className="mt-1 text-xs text-muted">{roleLabel}</p>
            {user ? (
              <p className="mt-1 truncate text-[11px] text-slate-400">{user.email}</p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-400">Authentication is not connected</p>
            )}
          </div>
          <button
            className="mt-2 flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
            onClick={() => {
              setOpen(false);
              toast(user ? "Profile settings are not available yet." : "Profile settings are preview-only.");
            }}
            type="button"
          >
            <UserRound aria-hidden="true" className="size-4 text-slate-400" />
            Profile settings
          </button>
          <button
            className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-xs font-medium text-slate-400"
            onClick={() => {
              setOpen(false);
              if (!user) {
                toast.error("Sign out is unavailable in this preview.");
                return;
              }
              logout();
              navigate("/login", { replace: true });
              toast.success("You have been signed out.");
            }}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-4" />
            {user ? "Sign out" : "Sign out (preview only)"}
          </button>
        </div>
      )}
    </div>
  );
}
