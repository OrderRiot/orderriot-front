import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Discover from "@/pages/Discover";
import CampaignDetail from "@/pages/CampaignDetail";
import CreateCampaign from "@/pages/CreateCampaign";
import Profile from "@/pages/Profile";
import MyCampaigns from "@/pages/MyCampaigns";
import MyContributions from "@/pages/MyContributions";
import PublicProfile from "@/pages/PublicProfile";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";

import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: (
      <AppLayout />
    ),
    children: [
      { path: "/", element: <Landing /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/discover", element: <Discover /> },
      { path: "/about", element: <About /> },
      { path: "/campaigns/:id", element: <CampaignDetail /> },
      { path: "/users/:id", element: <PublicProfile /> },
      {
        path: "/create",
        element: (
          <ProtectedRoute>
            <CreateCampaign />
          </ProtectedRoute>
        ),
      },
      {
        path: "/create/:id",
        element: (
          <ProtectedRoute>
            <CreateCampaign />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/campaigns",
        element: (
          <ProtectedRoute>
            <MyCampaigns />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/contributions",
        element: (
          <ProtectedRoute>
            <MyContributions />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </React.StrictMode>,
);
