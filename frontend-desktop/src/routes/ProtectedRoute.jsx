import { Navigate } from "react-router-dom"
import { useEffect, useState } from "react"

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token")
      setIsAuthenticated(!!token)
      setLoading(false)
    }

    checkAuth()
    
    // Écouter les changements de localStorage
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        checkAuth()
      }
    }
    
    window.addEventListener("storage", handleStorageChange)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de login
    return <Navigate to="/auth/login" replace />
  }

  // Authentifié, afficher les enfants
  return children
}