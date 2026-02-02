import { useEffect } from "react"
import { CheckCircle, PartyPopper, X } from "lucide-react"

function SuccessPopup({ isOpen, onClose }) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 30000) // 30 secondes
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-bounce-in">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center">
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
            >
              <X className="text-white" size={18} />
            </button>
          </div>
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="text-white" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Félicitations !</h2>
          <p className="text-green-100">
            Votre engagement a été enregistré avec succès
          </p>
        </div>

        <div className="p-6 text-center">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800">
                Merci pour votre générosité. Vous recevrez bientôt un email de confirmation 
                avec les détails de votre engagement.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-gray-600">
                Ce popup se fermera automatiquement dans{" "}
                <span className="font-bold text-blue-600">30 secondes</span>
              </p>
              
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500 animate-timer"
                    style={{ animationDuration: '30s' }}
                  />
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-medium flex items-center justify-center gap-2"
            >
              <CheckCircle size={20} />
              <span>Fermer maintenant</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuccessPopup