import { Menu } from "lucide-react";
import Breadcrumbs from "./Breadcrumbs.jsx";
import NotificationCenter from "./NotificationCenter.jsx";
import { roleOptions } from "./roleNavigation.js";
import UserProfileDropdown from "./UserProfileDropdown.jsx";
import { getDashboardPath } from "../../constants/auth.js";

export default function AppHeader({
  role,
  onRoleChange,
  onMenuClick,
  menuButtonRef,
  mobileMenuOpen,
  breadcrumbs,
  previewMode = false,
  user,
}) {
  return (
    <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-4 border-b border-line bg-white/95 px-4 backdrop-blur md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          aria-label="Open navigation"
          aria-controls="primary-navigation"
          aria-expanded={mobileMenuOpen}
          className="grid size-10 shrink-0 place-items-center rounded-lg border border-line text-slate-600 hover:bg-slate-50 md:hidden"
          onClick={onMenuClick}
          ref={menuButtonRef}
          type="button"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <div className="min-w-0">
          <Breadcrumbs
            homePath={previewMode ? "/design-system" : getDashboardPath(role)}
            items={breadcrumbs}
          />
          <p className="mt-1 hidden truncate text-xs text-slate-400 sm:block">
            A calm space to move support forward
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {previewMode && (
          <label className="hidden items-center gap-2 text-xs font-medium text-muted lg:flex">
            Preview role
            <select
              aria-label="Preview role"
              className="min-h-9 rounded-lg border border-line bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
              onChange={(event) => onRoleChange(event.target.value)}
              value={role}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        )}
        {previewMode && <NotificationCenter />}
        <UserProfileDropdown role={role} user={user} />
      </div>
    </header>
  );
}
