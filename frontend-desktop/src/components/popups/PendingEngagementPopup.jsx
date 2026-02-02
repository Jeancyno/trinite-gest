// PendingEngagementPopup.jsx - Version avec bouton Payer
import { useState, useEffect } from "react"
import { AlertTriangle, DollarSign, Calendar, CreditCard, X } from "lucide-react"

function PendingEngagementPopup({ isOpen, onClose, engagement, onPayer }) {
  const [remainingTime, setRemainingTime] = useState(30)
  
  useEffect(() => {
    if (!isOpen) return
    
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          onClose()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(interval)
  }, [isOpen, onClose])
  
  if (!isOpen || !engagement) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-slideUp">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-white" size={24} />
              <div>
                <h2 className="text-xl font-bold text-white">Engagement en cours</h2>
                <p className="text-amber-100 text-sm">Vous avez déjà un engagement actif</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
            >
              <X className="text-white" size={18} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 font-medium">
                Vous ne pouvez pas créer un nouvel engagement tant que vous n'avez pas finalisé le précédent.
              </p>
              <p className="text-amber-700 text-sm mt-2">
                Fermeture automatique dans {remainingTime}s
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Montant total:</span>
                <span className="font-bold">{engagement.montant_total} {engagement.devise}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Montant payé:</span>
                <span className="font-medium text-green-600">
                  {engagement.montant_paye} {engagement.devise}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Montant restant:</span>
                <span className="font-medium text-red-600">
                  {engagement.montant_restant} {engagement.devise}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Progression:</span>
                <span className="font-medium">{engagement.pourcentage_paye}%</span>
              </div>
              
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-500 h-full transition-all duration-500"
                  style={{ width: `${engagement.pourcentage_paye}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Date de fin:</span>
                <span className="font-medium">{engagement.date_fin}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                onClick={onPayer}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2"
              >
                <CreditCard size={18} />
                <span>Payer mon engagement</span>
              </button>
              
              <button
                onClick={onClose}
                className="w-full py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
              >
                Je vais d'abord finaliser mon engagement
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PendingEngagementPopup