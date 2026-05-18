import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

export function AppLayout() {
  const { pathname } = useLocation();
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
