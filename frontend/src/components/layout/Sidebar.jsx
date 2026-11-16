import { forwardRef } from "react";
import { LifeBuoy, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getNavigationForRole } from "./roleNavigation.js";
import { getDashboardPath } from "../../constants/auth.js";

const Sidebar = forwardRef(function Sidebar({
  role,
  open,
  onClose,
  onRoleChange,
  previewMode = false,
}, ref) {
  const homePath = previewMode ? "/design-system" : getDashboardPath(role);
  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 md:hidden"
          onClick={onClose}
          type="button"
        />
      )}
      <aside
        aria-label="Primary navigation"
        aria-modal={open ? "true" : undefined}
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-line bg-white transition-transform duration-200 md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        id="primary-navigation"
        ref={ref}
        role={open ? "dialog" : undefined}
      >
        <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
          <NavLink
            aria-label={previewMode ? "SmartResolve design preview home" : "SmartResolve workspace home"}
            className="inline-flex items-center gap-3"
            onClick={onClose}
            to={homePath}
          >
            <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
              <LifeBuoy aria-hidden="true" className="size-5" />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-tight text-ink">SmartResolve</span>
              <span className="block text-[11px] font-medium text-muted">Support workspace</span>
            </span>
          </NavLink>
          <button
            aria-label="Close navigation"
            className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
        <nav className="flex-1 px-3 py-5">
          {previewMode && (
            <label className="mb-5 grid gap-1.5 px-3 text-xs font-medium text-muted lg:hidden">
              Preview role
              <select
                aria-label="Preview role"
                className="min-h-10 rounded-lg border border-line bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
                onChange={(event) => onRoleChange(event.target.value)}
                value={role}
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="SUPPORT_ENGINEER">Support Engineer</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </label>
          )}
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Workspace
          </p>
          <ul className="grid gap-1">
            {getNavigationForRole(role, previewMode).map(({ label, path, icon: Icon }) => (
              <li key={label}>
                <NavLink
                  className={({ isActive }) =>
                    `group flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-ink"}`
                  }
                  onClick={onClose}
                  to={path}
                >
                  {({ isActive }) => (
                    <>
                      <Icon aria-hidden="true" className={`size-[18px] ${isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                      <span className="flex-1">{label}</span>
                      {isActive && <span aria-hidden="true" className="h-5 w-0.5 rounded-full bg-brand-600" />}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
            {previewMode && (
              <li>
                <NavLink
                  className={({ isActive }) =>
                    `group mt-5 flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${isActive ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-ink"}`
                  }
                  onClick={onClose}
                  to="/design-system"
                >
                  <span className="size-[18px] rounded border border-current opacity-60" aria-hidden="true" />
                  <span className="flex-1">Design system</span>
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
        <div className="m-3 rounded-xl border border-brand-100 bg-brand-50/70 p-4">
          <p className="text-xs font-semibold text-brand-700">A clearer support workflow</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Keep ticket context, activity, and next steps together.
          </p>
        </div>
        <div className="border-t border-line px-5 py-3 text-[11px] text-muted">
          {previewMode ? "SmartResolve UI preview" : "SmartResolve support workspace"}
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
