// pages/public/ConfirmationPage.jsx
import { useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  CheckCircle, Download, Mail, Printer, 
  Home, Share2, Calendar, DollarSign 
} from "lucide-react"

function ConfirmationPage() {
  const { transactionId } = useParams()
  const navigate = useNavigate()

  useEffect(() => {
    // Fermer la page après 30 secondes
    const timer = setTimeout(() => {
      navigate("/")
    }, 30000)

    return () => clearTimeout(timer)
  }, [navigate])

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Confirmation de paiement',
        text: 'J\'ai effectué un paiement pour mon engagement à l\'église',
        url: window.location.href,
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        {/* Carte de confirmation */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-white" size={48} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Paiement Confirmé !
            </h1>
            <p className="text-green-100">
              Transaction #{transactionId}
            </p>
          </div>

          {/* Contenu */}
          <div className="p-8">
            <div className="space-y-6">
              {/* Message */}
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Votre paiement a été traité avec succès. Merci pour votre générosité !
                </p>
                <p className="text-sm text-gray-500">
                  Un reçu a été envoyé à votre email.
                </p>
              </div>

              {/* Détails */}
              <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <DollarSign className="text-gray-500" size={20} />
                    <span className="text-gray-700">Montant payé</span>
                  </div>
                  <span className="font-bold text-lg">500 USD</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-500" size={20} />
                    <span className="text-gray-700">Date</span>
                  </div>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-gray-500" size={20} />
                    <span className="text-gray-700">Statut</span>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    Complété
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Download size={18} />
                    <span>Télécharger</span>
                  </button>
                  
                  <button className="py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Printer size={18} />
                    <span>Imprimer</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <button className="py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Mail size={18} />
                    <span>Email</span>
                  </button>
                  
                  <button 
                    onClick={handleShare}
                    className="py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    <span>Partager</span>
                  </button>
                </div>
              </div>

              {/* Bouton principal */}
              <button
                onClick={() => navigate("/")}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold flex items-center justify-center gap-3"
              >
                <Home size={20} />
                <span>Retour à l'accueil</span>
              </button>

              {/* Timer */}
              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Cette page se fermera automatiquement dans <span className="font-bold">30 secondes</span>
                </p>
                <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-green-500 h-full animate-timer"
                    style={{ animationDuration: '30s' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationPage