import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
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
import ProfileSettings from "@/pages/ProfileSettings";
import ProfileEdit from "@/pages/ProfileEdit";
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
import EditIdea from "@/pages/EditIdea";
import MyIdeas from "@/pages/MyIdeas";
import CollabBoard from "@/pages/CollabBoard";
import CollabDetail from "@/pages/CollabDetail";
import CreateCollab from "@/pages/CreateCollab";
import Messages from "@/pages/Messages";
import ConversationView from "@/pages/ConversationView";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
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
      { path: "/forgot-password", element: <ForgotPassword /> },
      { path: "/reset-password", element: <ResetPassword /> },
      { path: "/discover", element: <Discover /> },
      { path: "/about", element: <About /> },
      { path: "/campaigns/:slug", element: <CampaignDetail /> },
      { path: "/users/:username", element: <PublicProfile /> },
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
        path: "/profile/settings",
        element: (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile/edit",
        element: (
          <ProtectedRoute>
            <ProfileEdit />
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
      { path: "/organizations/:slug", element: <OrganizationPage /> },
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
      { path: "/collabs/:slug", element: <CollabDetail /> },
      { path: "/ideas", element: <IdeaFeed /> },
      {
        path: "/ideas/new",
        element: (
          <ProtectedRoute>
            <CreateIdea />
          </ProtectedRoute>
        ),
      },
      { path: "/ideas/:slug", element: <IdeaDetail /> },
      {
        path: "/ideas/:slug/edit",
        element: (
          <ProtectedRoute>
            <EditIdea />
          </ProtectedRoute>
        ),
      },
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
    <HelmetProvider>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ""}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </HelmetProvider>
  </React.StrictMode>,
);
