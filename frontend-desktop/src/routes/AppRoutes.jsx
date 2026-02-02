import { Routes, Route } from "react-router-dom"
import MainLayout from "../components/layout/MainLayout"

// Pages
import PasteurDashboard from "../pages/pasteur/Dashboard"
import PaiementConstruction from "../pages/construction/Engagements"
import EngagementConstruction from "../pages/construction/Paiement"
import PaiementDime from "../pages/dime/Paiement"
import Users from "../pages/admin/Users"
import LoginPage from "../pages/auth/Login"
import AddMemberPage from "../pages/membres/AddMemberPage"
import MembersListPage from "../pages/membres/Membre"
import MemberDetailPage from "../pages/membres/MemberDetailPage" // Nouveau
import SettingsPage from "../pages/admin/Parametre"
import ChangePassword from "../pages/auth/ChangePassword"
import ProtectedRoute from "../routes/ProtectedRoute"
import EngagementForm from "../pages/public/EngagementForm"
import DimeForm from "../pages/public/choix-payement/paiement/DimeForm"
import ChoixPaiement from "../pages/public/choix-payement/paiement/ChoixPaiement"
import EngagementFormPaye from "../pages/public/choix-payement/paiement/EngagementFormPaye"
import VerifyHuman from "../pages/auth/VerifyHuman"
import PaiementDimeTest from "../pages/public/choix-payement/paiement/PaiementDime"
import PaiementEngagement from "../pages/public/choix-payement/paiement/PaiementEngagement"
import TestPayment from "../pages/public/choix-payement/paiement/TestPayment"
import ConfirmationPaiement from "../pages/public/choix-payement/paiement/ConfirmationPaiement"
import EtatEngagements from "../pages/construction/EtatEngagements"
import DepensesPage from "../pages/sec/DepensesPage"

export default function AppRoutes() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="auth/login" element={<LoginPage />} />
      {/* <Route path="auth/reset-password" element={<ResetPasswordPage />} /> */}
      <Route path="auth/changePassword" element={<ChangePassword />} />
   <Route path="/engagement-form" element={<EngagementForm />} />
   <Route path="/verify-human" element={<VerifyHuman />} />
  <Route path="/choix-paiement" element={<ChoixPaiement />} />
  <Route path="/public/dime" element={<DimeForm />} />
  <Route path="/public/engagement" element={<EngagementFormPaye />} />
  <Route path="/paiement/dime" element={<PaiementDimeTest />} />
<Route path="/paiement/engagement" element={<PaiementEngagement />} />
<Route path="/test-payment" element={<TestPayment />} />
<Route path="/confirmation-paiement" element={<ConfirmationPaiement />} />

        {/* Routes protégées */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        {/* Dashboard */}
        <Route index  element={<PasteurDashboard />} />
     

        {/* Construction */}
        <Route
          path="construction/engagements"
          element={<EngagementConstruction />}
        />
        <Route
          path="construction/paiement"
          element={<PaiementConstruction />}
        />
        <Route
          path="construction/EtatEngagements"
          element={<EtatEngagements />}
        />

        {/* Dîme */}
        <Route
          path="dime/paiement"
          element={<PaiementDime />}
        />

        {/* Administration */}
        <Route
          path="admin/users"
          element={<Users />}
        />
        <Route
          path="/sec/DepensesPage"
          element={<DepensesPage />}
        />
        <Route
          path="admin/parametre"
          element={<SettingsPage />}
        />

        {/* Membres - Routes CRUD */}
        <Route
          path="membres"
          element={<MembersListPage />}
        />
        <Route
          path="membres/create"
          element={<AddMemberPage />}
        />
        <Route
          path="membres/:id"
          element={<MemberDetailPage />}
        />
      

        {/* Redirection pour compatibilité */}
        <Route
          path="AddMembrePage"
          element={<AddMemberPage />}
        />
        <Route
          path="Membre"
          element={<MembersListPage />}
        />
        
   
      </Route>
      
      {/* Redirection par défaut */}
      <Route path="*" element={<div>404 - Page non trouvée</div>} />
    </Routes>
  )
}