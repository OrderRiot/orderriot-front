import { useEffect } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ga } from "@/lib/analytics";
import { useMe } from "@/lib/queries";

export function AppLayout() {
  const { pathname } = useLocation();
  const me = useMe();

  // Page view on every route change
  useEffect(() => {
    ga.pageView(pathname);
  }, [pathname]);

  // Associate GA session with logged-in user; clears on logout
  useEffect(() => {
    ga.setUser(me.data?.user_id ?? null);
  }, [me.data?.user_id]);

  const hideFooter = /^\/(messages|create|profile|admin|organizations\/new|ideas\/[^/]+\/edit|forgot-password|reset-password)/.test(pathname);

  return (
    <div className="flex min-h-full flex-col bg-paper">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <ScrollRestoration />
    </div>
  );
}
