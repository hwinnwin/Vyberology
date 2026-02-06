import { useState, useEffect } from "react";
import { Wifi, Volume2, Battery, Bell, Search } from "lucide-react";
import { useOSStore } from "@/stores/os";

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="text-sm font-medium">
      {time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      {" "}
      {time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
    </span>
  );
}

export function MenuBar() {
  const { windows, notifications, openWindow } = useOSStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Get focused window for app menu
  const focusedWindow = windows.find((w) => w.isFocused);
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="fixed left-0 right-0 top-0 z-[10000] flex h-7 items-center justify-between bg-black/30 px-4 text-white backdrop-blur-xl">
      {/* Left side - Apple menu and app menus */}
      <div className="flex items-center gap-4">
        {/* Vybe logo */}
        <button
          className="flex items-center gap-1 rounded px-2 py-0.5 text-sm font-bold transition-colors hover:bg-white/10"
          onClick={() => openWindow("browser")}
        >
          <span className="text-base">✨</span>
          <span className="gradient-text">VYBE</span>
        </button>

        {/* Current app name */}
        {focusedWindow && (
          <>
            <span className="text-sm font-semibold">{focusedWindow.title}</span>
            <div className="flex items-center gap-3 text-sm text-white/70">
              <button className="rounded px-2 py-0.5 transition-colors hover:bg-white/10">
                File
              </button>
              <button className="rounded px-2 py-0.5 transition-colors hover:bg-white/10">
                Edit
              </button>
              <button className="rounded px-2 py-0.5 transition-colors hover:bg-white/10">
                View
              </button>
              <button className="rounded px-2 py-0.5 transition-colors hover:bg-white/10">
                Window
              </button>
              <button className="rounded px-2 py-0.5 transition-colors hover:bg-white/10">
                Help
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right side - System tray */}
      <div className="flex items-center gap-3">
        {/* Spotlight search */}
        <button
          className="rounded p-1 transition-colors hover:bg-white/10"
          title="Search (Cmd+Space)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Control center icons */}
        <div className="flex items-center gap-2 text-white/80">
          <Wifi className="h-4 w-4" />
          <Volume2 className="h-4 w-4" />
          <div className="flex items-center gap-0.5">
            <Battery className="h-4 w-4" />
            <span className="text-xs">100%</span>
          </div>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded p-1 transition-colors hover:bg-white/10"
          onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        >
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* Clock */}
        <Clock />
      </div>

      {/* Notification dropdown */}
      {isNotificationOpen && (
        <div className="absolute right-4 top-8 w-80 rounded-xl bg-gray-900/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <button
              className="text-xs text-vyber-purple hover:underline"
              onClick={() => useOSStore.getState().clearAllNotifications()}
            >
              Clear All
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/50">
              No notifications
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg p-3 transition-colors ${
                    notification.read ? "bg-white/5" : "bg-white/10"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notification.icon && (
                      <span className="text-lg">{notification.icon}</span>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-white/60">{notification.message}</p>
                    </div>
                    <button
                      className="text-white/40 hover:text-white"
                      onClick={() =>
                        useOSStore.getState().clearNotification(notification.id)
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
