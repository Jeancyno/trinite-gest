// NotificationsPopup.jsx - VERSION COMPLÈTE
import { 
  X, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Clock,
  Loader2,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  UserPlus,
  FileText,
  RefreshCw
} from "lucide-react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import axios from "axios"

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

  // Charger le nombre de notifications non lues
  useEffect(() => {
    if (currentUser) {
      loadUnreadCount()
    }
  }, [currentUser])

  // 3. Ensuite, toutes les fonctions
  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      console.log("Chargement notifications pour user:", currentUser)
      
      // 🔥 CONNEXION À L'API LARAVEL
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      const response = await axios.get('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          per_page: 10
        }
      })
      
      if (response.data.success) {
        setNotifications(response.data.data.data || response.data.data)
        setUnreadCount(response.data.unread_count || 0)
      } else {
        // Fallback aux données de démo si erreur
        loadDemoData()
      }
      
    } catch (error) {
      console.error("Erreur chargement notifications:", error)
      
      // Si erreur 401 (non autorisé), rediriger vers login
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.")
        navigate('/login')
        return
      }
      
      // Fallback aux données de démo
      loadDemoData()
      toast.error("Impossible de charger les notifications depuis le serveur")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      const response = await axios.get('/api/notifications/unread-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      if (response.data.success) {
        setUnreadCount(response.data.count || 0)
      }
    } catch (error) {
      console.error("Erreur chargement nombre notifications:", error)
    }
  }

  const loadDemoData = () => {
    // Données de démo filtrées par rôle
    let demoNotifications = []
    
    if (currentUser?.role === 'tresorier') {
      // Trésorier ne voit que les dîmes
      demoNotifications = [
        {
          id: 1,
          title: "Paiement Dîme",
          message: "David Mbayo a payé 75 USD (Dîme)",
          type: "dime",
          role: "tresorier",
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: "Paiement Dîme",
          message: "Sarah Kabasele a payé 15000 CDF (Dîme)",
          type: "dime",
          role: "all",
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ]
    } else if (['pasteur', 'super_admin', 'secretaire'].includes(currentUser?.role)) {
      // Pasteur/Admin/Secretaire voient tout
      demoNotifications = [
        {
          id: 1,
          title: "Paiement enregistré",
          message: "David Mbayo a payé 75 USD (Dîme)",
          type: "dime",
          role: "all",
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          title: "Nouvel engagement",
          message: "Paul Lukusa s'est engagé pour 500 USD",
          type: "engagement",
          role: "all",
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          title: "Nouvelle dépense",
          message: "Achat matériel construction - 250 USD",
          type: "expense",
          role: "all",
          is_read: true,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 4,
          title: "Nouveau membre",
          message: "Sophie Matadi s'est inscrite",
          type: "member",
          role: "all",
          is_read: true,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
    }
    
    setNotifications(demoNotifications)
    setUnreadCount(demoNotifications.filter(n => !n.is_read).length)
  }

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      await axios.put(`/api/notifications/mark-read/${id}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      console.error("Erreur marquage comme lu:", error)
      // Mettre à jour localement même en cas d'erreur
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      await axios.put('/api/notifications/mark-all-read', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      setUnreadCount(0)
      
      if (onMarkAllRead) {
        onMarkAllRead()
      }
      
      toast.success("Toutes les notifications marquées comme lues")
      
    } catch (error) {
      console.error("Erreur marquage tout comme lu:", error)
      // Mettre à jour localement même en cas d'erreur
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      setUnreadCount(0)
      
      if (onMarkAllRead) {
        onMarkAllRead()
      }
    }
  }

  const deleteNotification = async (id, e) => {
    e.stopPropagation()
    
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      await axios.delete(`/api/notifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      // Supprimer localement
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      // Mettre à jour le compteur si non lu
      const notification = notifications.find(n => n.id === id)
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
      
      toast.success("Notification supprimée")
      
    } catch (error) {
      console.error("Erreur suppression notification:", error)
      toast.error("Erreur lors de la suppression")
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMinutes < 1) return "À l'instant"
    if (diffMinutes < 60) return `Il y a ${diffMinutes}min`
    if (diffHours < 24) return `Il y a ${diffHours}h`
    if (diffHours < 48) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays}j`
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  const getIconForType = (type) => {
    switch(type) {
      case 'dime':
      case 'payment':
        return { icon: DollarSign, color: 'bg-green-100 text-green-600' }
      case 'engagement':
      case 'promesse':
        return { icon: TrendingUp, color: 'bg-blue-100 text-blue-600' }
      case 'expense':
      case 'depense':
        return { icon: TrendingDown, color: 'bg-red-100 text-red-600' }
      case 'member':
      case 'membre':
        return { icon: UserPlus, color: 'bg-purple-100 text-purple-600' }
      case 'warning':
      case 'alerte':
        return { icon: AlertCircle, color: 'bg-amber-100 text-amber-600' }
      case 'info':
      default:
        return { icon: MessageSquare, color: 'bg-gray-100 text-gray-600' }
    }
  }

  const handleNotificationClick = (notification) => {
    // Marquer comme lu
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    
    // Navigation selon le type
    switch(notification.type) {
      case 'dime':
      case 'payment':
        navigate('/dimes')
        break
      case 'engagement':
      case 'promesse':
        navigate('/promesses')
        break
      case 'expense':
      case 'depense':
        navigate('/depenses')
        break
      case 'member':
      case 'membre':
        navigate('/membres')
        break
      default:
        navigate('/notifications')
    }
    
    onClose()
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
        {/* Header avec bouton "Marquer tout comme lu" */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="text-primary" size={20} />
            <div>
              <h3 className="font-bold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-500">
                  {unreadCount} non {unreadCount === 1 ? 'lue' : 'lues'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-primary hover:underline px-2 py-1"
              >
                Tout marquer lu
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
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
              <p className="text-xs text-gray-400 mt-1">
                Vous êtes à jour !
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const { icon: Icon, color } = getIconForType(notification.type)
              
              return (
                <div 
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-gray-900 truncate">{notification.title}</h4>
                        <button 
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={12} />
                          <span>{formatTime(notification.created_at)}</span>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      {/* Badge type */}
                      <div className="mt-2">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 capitalize">
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center">
          <button 
            onClick={() => {
              navigate("notifications/notificationsPage")
              onClose()
            }}
            className="text-center text-primary hover:underline text-sm"
          >
            Voir toutes les notifications
          </button>
          <button 
            onClick={() => {
              loadNotifications()
              toast.info("Notifications actualisées")
            }}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            Actualiser
          </button>
        </div>
      </div>
    </>
  )
}