// pages/public/NotFoundPage.jsx
import { useNavigate } from "react-router-dom"
import { Home, ArrowLeft, Search } from "lucide-react"

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Illustration */}
        <div className="mb-8">
          <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
            <Search className="text-blue-600" size={64} />
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page non trouvée</h2>
          <p className="text-gray-600">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={() => navigate("/")}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2"
          >
            <Home size={20} />
            <span>Retour à l'accueil</span>
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={20} />
            <span>Page précédente</span>
          </button>
        </div>

        {/* Liens utiles */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">Vous cherchez peut-être :</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate("/engagement-form")}
              className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-sm"
            >
              Formulaire d'engagement
            </button>
            <button
              onClick={() => navigate("/engagement-qr")}
              className="p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-sm"
            >
              QR Code
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotFoundPage