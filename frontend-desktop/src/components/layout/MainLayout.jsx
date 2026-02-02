import { useState } from "react"
import Sidebar from "./Sidebar"
import Topbar from "./Topbar"
import PaymentModal from "../ui/PaymentModal"
import { Outlet } from "react-router-dom"

export default function MainLayout() {
// ... dans ton MainLayout
const [openPayment, setOpenPayment] = useState(false)
const [activeRole, setActiveRole] = useState(null) // État pour stocker le rôle

return (
  <div className="flex h-screen">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      {/* MODIFICATION ICI : On récupère le rôle et on l'enregistre */}
      <Topbar onOpenPayment={(role) => {
        setActiveRole(role);
        setOpenPayment(true);
      }} />

      <main className="flex-1 p-6 bg-gray-50 overflow-y-auto">
        <Outlet />
      </main>
    </div>

    <PaymentModal
      key={openPayment ? "open" : "closed"}
      open={openPayment}
      onClose={() => setOpenPayment(false)}
      userRole={activeRole} // ON PASSE LE RÔLE STOCKÉ
      type="construction"
    />
  </div>
)
}