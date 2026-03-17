import { Routes, Route } from "react-router-dom"
import MainLayout from "../components/layout/MainLayout"
import ProtectedRoute from "./ProtectedRoute"

// Pages publiques
import LoginPage from "../pages/auth/Login"
import ChangePassword from "../pages/auth/ChangePassword"
import VerifyHuman from "../pages/auth/VerifyHuman"
import EngagementForm from "../pages/public/EngagementForm"
import ChoixPaiement from "../pages/public/choix-payement/paiement/ChoixPaiement"
import DimeForm from "../pages/public/choix-payement/paiement/DimeForm"
import EngagementFormPaye from "../pages/public/choix-payement/paiement/EngagementFormPaye"
import TestPayment from "../pages/public/choix-payement/paiement/TestPayment"
import ConfirmationPaiement from "../pages/public/choix-payement/paiement/ConfirmationPaiement"

// Pages protégées
import PasteurDashboard from "../pages/pasteur/Dashboard"
import EngagementConstruction from "../pages/construction/Paiement"
import PaiementConstruction from "../pages/construction/Engagements"
import EtatEngagements from "../pages/construction/EtatEngagements"
import PaiementDime from "../pages/dime/Paiement"
import Users from "../pages/admin/Users"
import SettingsPage from "../pages/admin/Parametre"
import MembersListPage from "../pages/membres/Membre"
import AddMemberPage from "../pages/membres/AddMemberPage"
import MemberDetailPage from "../pages/membres/MemberDetailPage"
import NotificationsPage from "../pages/notifications/NotificationsPage"
import RapportsPage from "../pages/rapports/rapports"
import DepensesPage from "../pages/sec/DepensesPage"

// 404
import NotFoundPage from "../pages/NotFoundPage"

export default function AppRoutes() {
  return (
    <Routes>

      {/* ===== ROUTES PUBLIQUES ===== */}
      
      <Route path="/verify-human" element={<VerifyHuman />} />
      <Route path="/engagement-form" element={<EngagementForm />} />
      <Route path="/choix-paiement" element={<ChoixPaiement />} />
      <Route path="/public/dime" element={<DimeForm />} />
      <Route path="/public/engagement" element={<EngagementFormPaye />} />
      <Route path="/test-payment" element={<TestPayment />} />
      <Route path="/confirmation-paiement" element={<ConfirmationPaiement />} />

      {/* ===== ROUTES PROTÉGÉES ===== */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<PasteurDashboard />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/changePassword" element={<ChangePassword />} />
        <Route path="construction/paiement" element={<PaiementConstruction />} />
        <Route path="construction/engagements" element={<EngagementConstruction />} />
        <Route path="construction/etat-engagements" element={<EtatEngagements />} />

        <Route path="dime/paiement" element={<PaiementDime />} />

        <Route path="admin/users" element={<Users />} />
        <Route path="admin/parametre" element={<SettingsPage />} />

        <Route path="membres" element={<MembersListPage />} />
        <Route path="membres/create" element={<AddMemberPage />} />
        <Route path="membres/:id" element={<MemberDetailPage />} />

        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="rapports" element={<RapportsPage />} />
        <Route path="depenses" element={<DepensesPage />} />
      </Route>

      {/* ===== 404 ===== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
