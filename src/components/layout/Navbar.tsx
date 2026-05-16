import { Link, NavLink, useNavigate } from "react-router-dom";
import { Bell, MessageSquare, Menu, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLogout, useMe, useUnreadCount, useNotifications, useMarkAllRead, useMsgUnreadCount } from "@/lib/queries";
import { initials } from "@/lib/utils";
import { UserType } from "@/lib/types";

const links = [
  { to: "/discover", label: "Discover" },
  { to: "/ideas", label: "Ideas" },
  { to: "/collabs", label: "Collaborate" },
  { to: "/create", label: "Start a campaign" },
  { to: "/about", label: "About" },
];

export function Navbar() {
  const me = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = useUnreadCount();
  const notifications = useNotifications();
  const markAllRead = useMarkAllRead();
  const msgUnread = useMsgUnreadCount();

  return (
    <header className="sticky top-0 z-40 bg-paper/90 backdrop-blur border-b border-line">
      <div className="container-edge flex h-16 items-center justify-between gap-6">
        {/* Wordmark */}
        <Link to="/" className="flex items-center" aria-label="OrderRiot home">
          <span className="font-display font-bold text-[1.35rem] tracking-tight text-ink">Order</span>
          <span className="font-display font-bold text-[1.35rem] tracking-tight text-accent">Riot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium link-quiet transition-colors ${
                  isActive ? "text-ink" : "text-muted-foreground hover:text-ink"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {me.data?.user_type === UserType.admin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm font-medium link-quiet transition-colors ${
                  isActive ? "text-ink" : "text-muted-foreground hover:text-ink"
                }`
              }
            >
              Admin
            </NavLink>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/discover")}
            aria-label="Search"
            className="hidden md:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-ink hover:bg-muted transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Messages icon */}
          {me.data && (
            <button
              type="button"
              onClick={() => navigate("/messages")}
              aria-label="Messages"
              className="relative h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-ink hover:bg-muted transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              {(msgUnread.data ?? 0) > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
              )}
            </button>
          )}

          {/* Notification bell */}
          {me.data && (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative focus-visible:outline-none h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-ink hover:bg-muted transition-colors">
                <Bell className="h-4 w-4" />
                {(unread.data ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {(unread.data ?? 0) > 0 && (
                    <button
                      onClick={() => markAllRead.mutate()}
                      className="text-xs font-normal text-muted-foreground hover:text-ink"
                    >
                      Mark all read
                    </button>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.data?.length === 0 && (
                  <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No notifications yet.
                  </div>
                )}
                {notifications.data?.map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => n.link && navigate(n.link)}
                    className={`flex flex-col items-start gap-0.5 py-3 cursor-pointer ${!n.is_read ? "bg-muted/40" : ""}`}
                  >
                    <span className="font-medium text-sm">{n.title}</span>
                    {n.body && <span className="text-xs text-muted-foreground">{n.body}</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {me.data ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="focus-visible:outline-none focus-visible:ring-2 ring-accent ring-offset-2 ring-offset-paper rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={me.data.avatar_url ?? undefined} alt={me.data.username} />
                  <AvatarFallback className="bg-accent text-white text-xs font-bold">
                    {initials(me.data.username)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="text-xs text-muted-foreground font-normal">Signed in as</div>
                  <div className="text-ink text-sm font-semibold mt-0.5">{me.data.username}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  Your profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/campaigns")}>
                  Your campaigns
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/contributions")}>
                  Backed projects
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/organizations")}>
                  Your organizations
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/ideas")}>
                  Your ideas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/messages")}>
                  Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/collabs/new")}>
                  Post a collab
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/create")}>
                  Start a campaign
                </DropdownMenuItem>
                {me.data.user_type === UserType.admin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/admin")}>
                      Admin dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout.mutate();
                    navigate("/");
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden h-9 w-9 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors text-ink"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-line bg-paper">
          <div className="container-edge py-5 flex flex-col gap-4">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="text-xl font-display font-semibold"
              >
                {l.label}
              </NavLink>
            ))}
            {me.data?.user_type === UserType.admin && (
              <NavLink
                to="/admin"
                onClick={() => setOpen(false)}
                className="text-xl font-display font-semibold"
              >
                Admin
              </NavLink>
            )}
            {!me.data && (
              <div className="flex gap-3 pt-4 border-t border-line">
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/login" onClick={() => setOpen(false)}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/register" onClick={() => setOpen(false)}>
                    Get started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
