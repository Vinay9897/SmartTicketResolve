import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, CircleAlert, MessageSquareText, Ticket } from "lucide-react";

const initialNotifications = [
  {
    id: "n-1",
    title: "Ticket assigned",
    description: "SR-2481 was assigned to your support queue.",
    time: "8 min ago",
    icon: Ticket,
    read: false,
  },
  {
    id: "n-2",
    title: "New comment",
    description: "An employee replied to SR-2479.",
    time: "24 min ago",
    icon: MessageSquareText,
    read: false,
  },
  {
    id: "n-3",
    title: "Priority updated",
    description: "A ticket in the payroll queue is marked high priority.",
    time: "1 hour ago",
    icon: CircleAlert,
    read: true,
  },
];

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

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

  function markAllRead() {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }

  function markRead(id) {
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        aria-controls="notification-popover"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Notifications, ${unreadCount} unread`}
        className="relative grid size-10 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
        onClick={() => setOpen((isOpen) => !isOpen)}
        type="button"
      >
        <Bell aria-hidden="true" className="size-[18px]" />
        {unreadCount > 0 && (
          <span aria-hidden="true" className="absolute right-0.5 top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[9px] font-semibold leading-none text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section
          aria-labelledby="notification-title"
          className="absolute right-0 top-full z-30 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-white shadow-lg"
          id="notification-popover"
          role="dialog"
        >
          <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold text-ink" id="notification-title">Notifications</h2>
              <p className="mt-0.5 text-xs text-muted">Local preview items</p>
            </div>
            <button
              className="inline-flex min-h-8 items-center gap-1.5 rounded-md px-2 text-[11px] font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:text-slate-400 disabled:hover:bg-transparent"
              disabled={!unreadCount}
              onClick={markAllRead}
              type="button"
            >
              <CheckCheck aria-hidden="true" className="size-3.5" />
              Mark all read
            </button>
          </header>
          <ul className="divide-y divide-line">
            {notifications.map(({ id, title, description, time, icon: Icon, read }) => (
              <li key={id}>
                <button
                  aria-label={`${read ? "Read" : "Unread"}: ${title}. ${description}`}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${read ? "" : "bg-brand-50/40"}`}
                  onClick={() => markRead(id)}
                  type="button"
                >
                  <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white text-brand-600 ring-1 ring-line">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-ink">{title}</span>
                      <span className="shrink-0 text-[10px] text-slate-400">{time}</span>
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted">{description}</span>
                  </span>
                  {!read && <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-600" />}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
