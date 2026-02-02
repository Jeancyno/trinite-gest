// Topbar.jsx - VERSION CORRIGÉE
import React, { useState, useEffect, useRef } from "react"
import { 
  CreditCard, 
  Search, 
  Bell, 
  Settings, 
  RefreshCw, 
  ChevronDown
} from "lucide-react"
import NotificationsPopup from "../../components/popups/NotificationsPopup"
import ProfilePopup from "../../components/popups/ProfilePopup"

export default function Topbar({ onOpenPayment,onOpenO }) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  
  const notificationsRef = useRef(null)
  const profileRef = useRef(null)

  const handleSync = () => {
    setIsSyncing(true);
    const syncEvent = new CustomEvent("app-synchronize");
    window.dispatchEvent(syncEvent);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  // Récupérer l'utilisateur
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && typeof user === 'object') {
          setCurrentUser(user);
        }
      } catch (error) {
        setCurrentUser(userData);
      }
    }
  }, []);

  // Empêcher le défilement quand un popup est ouvert
  useEffect(() => {
    if (isNotificationsOpen || isProfileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isNotificationsOpen, isProfileOpen])

  // Gestion des clics en dehors des popups
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si on clique en dehors du popup notifications ET du bouton notifications
      if (
        isNotificationsOpen && 
        notificationsRef.current && 
        !notificationsRef.current.contains(event.target) &&
        !event.target.closest('button[aria-label="notifications"]')
      ) {
        setIsNotificationsOpen(false)
      }
      
      // Si on clique en dehors du popup profile ET du bouton profile
      if (
        isProfileOpen && 
        profileRef.current && 
        !profileRef.current.contains(event.target) &&
        !event.target.closest('button[aria-label="profile"]')
      ) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationsOpen, isProfileOpen])

  // Toggle notifications
  const toggleNotifications = (e) => {
    e.stopPropagation()
    setIsNotificationsOpen(prev => {
      if (prev) return false
      setIsProfileOpen(false)
      return true
    })
  }

  // Toggle profile
  const toggleProfile = (e) => {
    e.stopPropagation()
    setIsProfileOpen(prev => {
      if (prev) return false
      setIsNotificationsOpen(false)
      return true
    })
  }

  // Fermer tous les popups
  const closeAllPopups = () => {
    setIsNotificationsOpen(false)
    setIsProfileOpen(false)
  }

  // Fonction pour obtenir l'initiale
  const getInitial = () => {
    if (!currentUser) return "A"
    if (typeof currentUser === 'string') {
      return currentUser.charAt(0).toUpperCase()
    }
    if (typeof currentUser === 'object' && currentUser !== null) {
      if (currentUser.name && typeof currentUser.name === 'string') {
        return currentUser.name.charAt(0).toUpperCase()
      }
    }
    return "A"
  }

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-8 relative z-40">
      
      {/* Barre de recherche */}
      <div className="relative z-10">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          placeholder="Rechercher un membre, un paiement, un engagement..."
          className="pl-12 pr-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-sm w-80 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
      </div>

      <div className="flex items-center gap-4 z-10">
        
        {/* Bouton Synchronisation */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className={`p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors relative ${isSyncing ? 'cursor-not-allowed' : ''}`}
          title="Synchroniser les données"
        >
          <RefreshCw 
            size={20} 
            className={`text-gray-600 ${isSyncing ? 'animate-spin' : ''}`}
          />
          {isSyncing && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
              !
            </div>
          )}
        </button>

        {/* Bouton Paiement rapide */}
        <button
          onClick={() => onOpenPayment(currentUser?.role)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-grey-600 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium text-sm"
        >
          <CreditCard size={18} />
          Paiement rapide
        </button>
        <button
          onClick={() => onOpenO()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-grey-600 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium text-sm"
        >
          <CreditCard size={18} />
          Paiement rapide
        </button>

        {/* Bouton Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button 
            onClick={toggleNotifications}
            aria-label="notifications"
            className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors relative"
          >
            <Bell size={20} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold border-2 border-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          
          {/* Popup Notifications */}
          <NotificationsPopup 
            isOpen={isNotificationsOpen} 
            onClose={() => setIsNotificationsOpen(false)}
            currentUser={currentUser}
            onMarkAllRead={() => setUnreadCount(0)}
            ref={notificationsRef}
          />
        </div>

        {/* Bouton Paramètres */}
        <button className="p-2.5 rounded-xl hover:bg-gray-100/80 transition-colors">
          <Settings size={20} className="text-gray-600" />
        </button>

        {/* Profil utilisateur */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={toggleProfile}
            aria-label="profile"
            className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:bg-gray-100/50 rounded-xl p-2 transition-colors"
          >
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px]">
                {currentUser?.name || "Utilisateur"}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {currentUser?.role?.replace('_', ' ') || "Membre"}
              </p>
            </div>
            <div className="relative">
              {currentUser?.avatar_url || currentUser?.avatar ? (
                <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-md">
                  <img 
                    src={currentUser.avatar_url || currentUser.avatar} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = `
                        <div class="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">
                          ${getInitial()}
                        </div>
                      `
                    }}
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center font-bold shadow-md">
                  {getInitial()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {/* Popup Profile */}
          <ProfilePopup 
            isOpen={isProfileOpen} 
            onClose={() => setIsProfileOpen(false)}
            ref={profileRef}
          />
        </div>

      </div>

      {/* Overlay pour fermer tous les popups */}
      {(isNotificationsOpen || isProfileOpen) && (
        <div 
          className="fixed inset-0 bg-black/10 z-30"
          onClick={closeAllPopups}
        />
      )}
    </header>
  )
}