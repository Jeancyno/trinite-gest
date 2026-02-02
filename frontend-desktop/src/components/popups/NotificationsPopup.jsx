// NotificationsPopup.jsx - VERSION CORRIGÉE
import { 
  X, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Clock,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"

export default function NotificationsPopup({ isOpen, onClose, currentUser, onMarkAllRead }) {
  // 1. Déclarez TOUS les hooks en premier
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  // 2. Ensuite, les effets
  useEffect(() => {
    if (isOpen && currentUser) {
      loadNotifications()
    }
  }, [isOpen, currentUser])

  // 3. Ensuite, toutes les fonctions
  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      console.log("Chargement notifications pour user:", currentUser)
      
      // Données de démo
      const demoNotifications = [
        {
          id: 1,
          title: "Paiement enregistré",
          message: "David Mbayo a payé 75 USD (Dîme)",
          type: "success",
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: "Nouveau membre",
          message: "Sophie Matadi s'est inscrite",
          type: "info",
          is_read: true,
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]
      
      setNotifications(demoNotifications)
      setUnreadCount(demoNotifications.filter(n => !n.is_read).length)
      
    } catch (error) {
      console.error("Erreur chargement notifications:", error)
      toast.error("Impossible de charger les notifications")
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now - date) / 3600000)
    
    if (diffHours < 1) return "À l'instant"
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffHours < 48) return "Hier"
    return date.toLocaleDateString('fr-FR')
  }

  // 4. ENFIN, le retour conditionnel
  if (!isOpen) {
    return null
  }

  // 5. Le JSX
  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div 
        className="fixed top-16 right-8 bg-white rounded-xl shadow-xl w-80 z-50 border border-gray-200"
        onClick={(e) => e.stopPropagation()}
        style={{ top: '64px' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-primary" size={20} />
            <h3 className="font-bold text-gray-900">Notifications</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center">
              <Loader2 className="animate-spin mx-auto text-primary" size={24} />
              <p className="text-gray-500 mt-2">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="mx-auto text-gray-400" size={32} />
              <p className="text-gray-500 mt-2">Aucune notification</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                  !notification.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    notification.type === 'success' ? 'bg-green-100' :
                    notification.type === 'warning' ? 'bg-amber-100' :
                    'bg-blue-100'
                  }`}>
                    {notification.type === 'success' && <CheckCircle className="text-green-600" size={16} />}
                    {notification.type === 'warning' && <AlertCircle className="text-amber-600" size={16} />}
                    {notification.type === 'info' && <MessageSquare className="text-blue-600" size={16} />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>{formatTime(notification.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={() => {
              navigate("/notifications")
              onClose()
            }}
            className="w-full text-center text-primary hover:underline text-sm"
          >
            Voir toutes les notifications
          </button>
        </div>
      </div>
    </>
  )
}