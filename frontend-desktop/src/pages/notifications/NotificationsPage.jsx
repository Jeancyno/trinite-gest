// src/pages/NotificationsPage.jsx
import React, { useState, useEffect } from 'react'
import { 
  Bell, 
  Trash2, 
  CheckCircle, 
  Clock, 
  Filter, 
  Search, 
  Eye, 
  EyeOff,
  Check,
  X,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  UserPlus,
  AlertCircle,
  MessageSquare
} from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all') // all, dime, engagement, expense, member
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    byType: {}
  })

  const itemsPerPage = 15

  // Charger les notifications
  useEffect(() => {
    loadNotifications()
    loadStats()
  }, [filter, typeFilter, currentPage])

  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      const params = {
        page: currentPage,
        per_page: itemsPerPage
      }
      
      if (filter === 'unread') params.read = 'unread'
      if (filter === 'read') params.read = 'read'
      if (typeFilter !== 'all') params.type = typeFilter
      if (search) params.search = search

      const response = await axios.get('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params
      })

      if (response.data.success) {
        // Gérer la pagination Laravel
        if (response.data.data.data) {
          // Format pagination Laravel
          setNotifications(response.data.data.data)
          setTotalPages(response.data.data.last_page || 1)
        } else {
          // Format simple
          setNotifications(response.data.data || [])
          setTotalPages(1)
        }
      } else {
        toast.error('Erreur lors du chargement des notifications')
      }
    } catch (error) {
      console.error('Erreur:', error)
      if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
        window.location.href = '/login'
        return
      }
      toast.error('Impossible de charger les notifications')
      // Données de démo en cas d'erreur
      setNotifications(getDemoNotifications())
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      const response = await axios.get('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params: {
          per_page: 1000 // Pour calculer les stats
        }
      })

      if (response.data.success) {
        const allNotifications = response.data.data.data || response.data.data || []
        
        const stats = {
          total: allNotifications.length,
          unread: allNotifications.filter(n => !n.is_read).length,
          byType: {
            dime: allNotifications.filter(n => n.type === 'dime').length,
            engagement: allNotifications.filter(n => n.type === 'engagement').length,
            expense: allNotifications.filter(n => n.type === 'expense').length,
            member: allNotifications.filter(n => n.type === 'member').length,
            other: allNotifications.filter(n => !['dime', 'engagement', 'expense', 'member'].includes(n.type)).length
          }
        }
        
        setStats(stats)
      }
    } catch (error) {
      console.error('Erreur stats:', error)
    }
  }

  const getDemoNotifications = () => {
    return [
      {
        id: 1,
        title: "Paiement enregistré",
        message: "David Mbayo a payé 75 USD (Dîme)",
        type: "dime",
        role: "all",
        is_read: false,
        created_at: new Date().toISOString(),
        user: { name: "Admin" }
      },
      {
        id: 2,
        title: "Nouvel engagement",
        message: "Paul Lukusa s'est engagé pour 500 USD",
        type: "engagement",
        role: "all",
        is_read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        user: { name: "Secrétaire" }
      },
      {
        id: 3,
        title: "Nouvelle dépense",
        message: "Achat matériel construction - 250 USD",
        type: "expense",
        role: "all",
        is_read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        user: { name: "Trésorier" }
      },
      {
        id: 4,
        title: "Nouveau membre",
        message: "Sophie Matadi s'est inscrite",
        type: "member",
        role: "all",
        is_read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        user: { name: "Pasteur" }
      }
    ]
  }

  const getIconForType = (type) => {
    switch(type) {
      case 'dime':
      case 'payment':
        return { icon: DollarSign, color: 'bg-green-100 text-green-600', label: 'Dîme' }
      case 'engagement':
      case 'promesse':
        return { icon: TrendingUp, color: 'bg-blue-100 text-blue-600', label: 'Engagement' }
      case 'expense':
      case 'depense':
        return { icon: TrendingDown, color: 'bg-red-100 text-red-600', label: 'Dépense' }
      case 'member':
      case 'membre':
        return { icon: UserPlus, color: 'bg-purple-100 text-purple-600', label: 'Membre' }
      case 'warning':
      case 'alerte':
        return { icon: AlertCircle, color: 'bg-amber-100 text-amber-600', label: 'Alerte' }
      case 'info':
      default:
        return { icon: MessageSquare, color: 'bg-gray-100 text-gray-600', label: 'Info' }
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
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffHours < 48) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} j`
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(notifications.map(n => n.id))
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
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
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      )
      
      toast.success('Notification marquée comme lue')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du marquage')
    }
  }

  const markSelectedAsRead = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Sélectionnez d\'abord des notifications')
      return
    }

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      // Marquer chaque notification sélectionnée
      await Promise.all(
        selectedIds.map(id => 
          axios.put(`/api/notifications/mark-read/${id}`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          })
        )
      )
      
      setNotifications(prev => 
        prev.map(notif => 
          selectedIds.includes(notif.id) 
            ? { ...notif, is_read: true } 
            : notif
        )
      )
      
      setSelectedIds([])
      toast.success(`${selectedIds.length} notification(s) marquée(s) comme lue(s)`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du marquage')
    }
  }

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      await axios.delete(`/api/notifications/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
      
      setNotifications(prev => prev.filter(notif => notif.id !== id))
      setSelectedIds(prev => prev.filter(item => item !== id))
      
      toast.success('Notification supprimée')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const deleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Sélectionnez d\'abord des notifications')
      return
    }

    setShowDeleteConfirm(true)
  }

  const confirmDeleteSelected = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      
      // Supprimer chaque notification sélectionnée
      await Promise.all(
        selectedIds.map(id => 
          axios.delete(`/api/notifications/${id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          })
        )
      )
      
      setNotifications(prev => 
        prev.filter(notif => !selectedIds.includes(notif.id))
      )
      
      setSelectedIds([])
      setShowDeleteConfirm(false)
      
      toast.success(`${selectedIds.length} notification(s) supprimée(s)`)
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
      setShowDeleteConfirm(false)
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
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      )
      
      toast.success('Toutes les notifications marquées comme lues')
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du marquage')
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    loadNotifications()
  }

  const clearFilters = () => {
    setFilter('all')
    setTypeFilter('all')
    setSearch('')
    setCurrentPage(1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Bell className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600">
                Gérez toutes vos notifications système
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Tout marquer comme lu
            </button>
            <button
              onClick={loadNotifications}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Actualiser"
            >
              <RefreshCw size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.unread}</div>
            <div className="text-sm text-gray-600">Non lues</div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.byType.dime || 0}</div>
            <div className="text-sm text-gray-600">Dîmes</div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.byType.engagement || 0}</div>
            <div className="text-sm text-gray-600">Engagements</div>
          </div>
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.byType.expense || 0}</div>
            <div className="text-sm text-gray-600">Dépenses</div>
          </div>
        </div>
      </div>

      {/* Barre de filtres et actions */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Recherche */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher dans les notifications..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </form>

          {/* Filtres */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="unread">Non lues</option>
                <option value="read">Lues</option>
              </select>
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="dime">Dîmes</option>
              <option value="engagement">Engagements</option>
              <option value="expense">Dépenses</option>
              <option value="member">Membres</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Effacer les filtres
            </button>
          </div>
        </div>

        {/* Actions groupées */}
        {selectedIds.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Bell className="text-blue-600" size={16} />
              </div>
              <span className="font-medium text-blue-900">
                {selectedIds.length} notification(s) sélectionnée(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={markSelectedAsRead}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Marquer comme lu
              </button>
              <button
                onClick={deleteSelected}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Liste des notifications */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto text-gray-400" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune notification</h3>
            <p className="mt-2 text-gray-600">
              {filter !== 'all' || typeFilter !== 'all' || search
                ? "Aucune notification ne correspond à vos filtres"
                : "Vous n'avez aucune notification pour le moment"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* En-tête du tableau */}
            <div className="bg-gray-50 px-6 py-3 flex items-center">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={selectedIds.length === notifications.length && notifications.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-medium text-gray-700">Notification</span>
              </div>
              <div className="w-32 text-sm font-medium text-gray-700">Type</div>
              <div className="w-40 text-sm font-medium text-gray-700">Date</div>
              <div className="w-24 text-sm font-medium text-gray-700 text-center">Statut</div>
              <div className="w-20 text-sm font-medium text-gray-700 text-center">Actions</div>
            </div>

            {/* Liste */}
            {notifications.map((notification) => {
              const { icon: Icon, color, label } = getIconForType(notification.type)
              
              return (
                <div 
                  key={notification.id}
                  className={`px-6 py-4 flex items-center hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* Sélection */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(notification.id)}
                      onChange={() => toggleSelect(notification.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    
                    {/* Icône et contenu */}
                    <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                      <Icon size={20} />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 truncate">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500">
                          Par: {notification.user?.name || 'Système'}
                        </span>
                        {notification.role && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                            {notification.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="w-32">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${color.replace('100', '50')} ${color.replace('100', '700')}`}>
                      <Icon size={12} />
                      {label}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="w-40 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {formatTime(notification.created_at)}
                    </div>
                  </div>

                  {/* Statut */}
                  <div className="w-24 text-center">
                    {notification.is_read ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <Eye size={12} />
                        Lu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <EyeOff size={12} />
                        Non lu
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-20 flex items-center justify-center gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-1.5 hover:bg-green-100 text-green-600 rounded-lg"
                        title="Marquer comme lu"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-1.5 hover:bg-red-100 text-red-600 rounded-lg"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} sur {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="text-red-600" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Confirmer la suppression</h3>
                <p className="text-sm text-gray-600">
                  Êtes-vous sûr de vouloir supprimer {selectedIds.length} notification(s) ?
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteSelected}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}