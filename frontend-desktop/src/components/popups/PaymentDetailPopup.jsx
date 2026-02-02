import { 
  X, 
  DollarSign, 
  User, 
  Calendar, 
  CreditCard, 
  Download,
  Printer,
  Copy
} from "lucide-react"
import { useEffect } from "react"

export default function PaymentDetailPopup({ payment, isOpen, onClose }) {
  // Désactiver le scroll du body quand le popup est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${
          isOpen ? 'animate-fadeIn' : 'animate-fadeOut'
        }`}
        onClick={handleOverlayClick}
      >
        {/* Popup */}
        <div 
          className={`bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto ${
            isOpen ? 'animate-slideUp' : 'animate-slideDown'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Détails de la transaction</h3>
              <p className="text-sm text-gray-500 mt-1">ID: #{payment.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-6">
            {/* Informations générales */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <DollarSign className="text-primary" size={24} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">
                    {payment.montant} {payment.devise}
                  </p>
                  <p className="text-sm text-gray-500">{payment.type_paiement}</p>
                </div>
              </div>

              {/* Membre */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User size={18} className="text-gray-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{payment.membre}</p>
                    <p className="text-sm text-gray-500">Membre ID: #{payment.membre_id}</p>
                  </div>
                </div>
                {payment.note && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-gray-600">Note:</p>
                    <p className="text-gray-700">{payment.note}</p>
                  </div>
                )}
              </div>

              {/* Détails transaction */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Date transaction</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {new Date(payment.date_transaction).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">Méthode</span>
                  </div>
                  <span className="font-medium text-gray-900">{payment.methode}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Percepteur</span>
                  <span className="font-medium text-gray-900">{payment.percepteur}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Référence</span>
                  <span className="font-medium text-gray-900">#{payment.reference_id}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enregistré le</span>
                  <span className="font-medium text-gray-900">
                    {new Date(payment.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-2">
                <button 
                  className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => console.log('Télécharger', payment.id)}
                >
                  <Download size={20} className="text-blue-600 mb-2" />
                  <span className="text-xs text-gray-700">Télécharger</span>
                </button>
                
                <button 
                  className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => console.log('Imprimer', payment.id)}
                >
                  <Printer size={20} className="text-green-600 mb-2" />
                  <span className="text-xs text-gray-700">Imprimer</span>
                </button>
                
                <button 
                  className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    navigator.clipboard.writeText(payment.id.toString())
                    console.log('ID copié:', payment.id)
                  }}
                >
                  <Copy size={20} className="text-purple-600 mb-2" />
                  <span className="text-xs text-gray-700">Copier ID</span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Fermer
              </button>
              <button 
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                onClick={() => console.log('Générer reçu complet', payment.id)}
              >
                Générer reçu complet
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}