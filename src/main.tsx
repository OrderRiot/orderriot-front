import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
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
import AdminDashboard from "@/pages/AdminDashboard";
import MyOrganizations from "@/pages/MyOrganizations";
import CreateOrganization from "@/pages/CreateOrganization";
import OrganizationPage from "@/pages/OrganizationPage";
import IdeaFeed from "@/pages/IdeaFeed";
import IdeaDetail from "@/pages/IdeaDetail";
import CreateIdea from "@/pages/CreateIdea";
import MyIdeas from "@/pages/MyIdeas";
import CollabBoard from "@/pages/CollabBoard";
import CollabDetail from "@/pages/CollabDetail";
import CreateCollab from "@/pages/CreateCollab";
import Messages from "@/pages/Messages";
import ConversationView from "@/pages/ConversationView";
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
      {
        path: "/admin",
        element: (
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "/organizations/new",
        element: (
          <ProtectedRoute>
            <CreateOrganization />
          </ProtectedRoute>
        ),
      },
      { path: "/organizations/:id", element: <OrganizationPage /> },
      {
        path: "/profile/organizations",
        element: (
          <ProtectedRoute>
            <MyOrganizations />
          </ProtectedRoute>
        ),
      },
      { path: "/collabs", element: <CollabBoard /> },
      {
        path: "/collabs/new",
        element: (
          <ProtectedRoute>
            <CreateCollab />
          </ProtectedRoute>
        ),
      },
      { path: "/collabs/:id", element: <CollabDetail /> },
      { path: "/ideas", element: <IdeaFeed /> },
      {
        path: "/ideas/new",
        element: (
          <ProtectedRoute>
            <CreateIdea />
          </ProtectedRoute>
        ),
      },
      { path: "/ideas/:id", element: <IdeaDetail /> },
      {
        path: "/profile/ideas",
        element: (
          <ProtectedRoute>
            <MyIdeas />
          </ProtectedRoute>
        ),
      },
      {
        path: "/messages",
        element: (
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        ),
      },
      {
        path: "/messages/:convId",
        element: (
          <ProtectedRoute>
            <ConversationView />
          </ProtectedRoute>
        ),
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
