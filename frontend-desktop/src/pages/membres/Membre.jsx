import { 
  Search, 
  User, 
  Phone, 
  MapPin, 
  Edit, 
  Trash2,
  Users,
  Plus,
  Filter,
  Download,
  Eye,
  ChevronDown,
  Calendar,
  Activity,
  BarChart3,
  RefreshCw,
  AlertCircle,
  UserPlus,
  CheckCircle,
  TrendingUp,
  Clock
} from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import api from "../../api/axios"

export default function MembersListPage() {

       useEffect(() => {
    const syncData = () => {
      console.log("Synchronisation détectée...");
      // Appelle ici tes fonctions de chargement
      if (typeof fetchDashboardData === 'function') {
        fetchDashboardData(); 
      }
    };
  
    // Écouter le signal envoyé par la Topbar
    window.addEventListener("app-synchronize", syncData);
  
    // Nettoyer l'écouteur quand on quitte la page
    return () => window.removeEventListener("app-synchronize", syncData);
  }, []);
  const navigate = useNavigate()
  
  // États
  const [isLoading, setIsLoading] = useState(true)
  const [members, setMembers] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSexe, setFilterSexe] = useState("")
  const [selectedMembers, setSelectedMembers] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [membersPerPage] = useState(10)
  const [stats, setStats] = useState({
    total: 0,
    hommes: 0,
    femmes: 0,
    nouveauCeMois: 0,
    nouveauCeSemaine: 0,
    avecEngagements: 0
  })

  const loadMembers = async () => {
    setIsLoading(true)
    try {
      const response = await api.get("/membres")
      
      let membersData = []
      
      // Gestion de la structure de données
      if (response.data && 
          response.data.success && 
          response.data.data && 
          response.data.data.data && 
          Array.isArray(response.data.data.data)) {
        membersData = response.data.data.data
      } else if (response.data && 
                 response.data.success && 
                 response.data.data && 
                 Array.isArray(response.data.data)) {
        membersData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        membersData = response.data
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        membersData = response.data.data
      } else {
        membersData = []
      }
      
      if (!Array.isArray(membersData)) {
        membersData = []
      }
      
      setMembers(membersData)
      
      // Calculer les statistiques avancées
      const total = membersData.length
      const hommes = membersData.filter(m => m.sexe === 'M').length
      const femmes = membersData.filter(m => m.sexe === 'F').length
      
      // Membres du mois
      const nouveauCeMois = membersData.filter(m => {
        if (!m.created_at) return false
        try {
          const createdAt = new Date(m.created_at)
          const now = new Date()
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear()
        } catch {
          return false
        }
      }).length
      
      // Membres de la semaine
      const nouveauCeSemaine = membersData.filter(m => {
        if (!m.created_at) return false
        try {
          const createdAt = new Date(m.created_at)
          const now = new Date()
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return createdAt >= oneWeekAgo
        } catch {
          return false
        }
      }).length
      
      // Membres avec engagements (si la donnée est disponible)
      const avecEngagements = membersData.filter(m => 
        m.active_engagements_count > 0 || m.promesses_count > 0
      ).length
      
      setStats({ 
        total, 
        hommes, 
        femmes, 
        nouveauCeMois,
        nouveauCeSemaine,
        avecEngagements
      })
      
      if (membersData.length > 0) {
        toast.success(`${membersData.length} membres chargés avec succès`)
      }
      
    } catch (error) {
      console.error("Erreur API:", error)
      
      if (error.response?.status === 401) {
        toast.error("Session expirée. Veuillez vous reconnecter.")
      } else {
        toast.error("Erreur lors du chargement des membres")
      }
      
      // Fallback: données locales
      const demoMembers = [
        {
          id: 1,
          nom: "KABEYA",
          postnom: "MULENDA",
          prenom: "Jean",
          sexe: "M",
          telephone: "+243 81 234 5678",
          adresse: "Quartier Salongo, Goma",
          created_at: new Date().toISOString(),
          photo_url: null
        },
        {
          id: 2,
          nom: "KAMANGA",
          postnom: "",
          prenom: "Marie",
          sexe: "F",
          telephone: "+243 97 654 3210",
          adresse: "Quartier Himbi, Goma",
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          photo_url: null
        }
      ]
      
      setMembers(demoMembers)
      setStats({
        total: demoMembers.length,
        hommes: demoMembers.filter(m => m.sexe === 'M').length,
        femmes: demoMembers.filter(m => m.sexe === 'F').length,
        nouveauCeMois: 2,
        nouveauCeSemaine: 2,
        avecEngagements: 0
      })
      
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  // Filtrer les membres
  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        (member.nom?.toLowerCase().includes(searchLower) || false) ||
        (member.postnom?.toLowerCase().includes(searchLower) || false) ||
        (member.prenom?.toLowerCase().includes(searchLower) || false) ||
        (member.telephone?.includes(searchTerm) || false) ||
        (member.adresse?.toLowerCase().includes(searchLower) || false)

      const matchesSexe = !filterSexe || member.sexe === filterSexe

      return matchesSearch && matchesSexe
    })
  }, [members, searchTerm, filterSexe])

  // Pagination
  const indexOfLastMember = currentPage * membersPerPage
  const indexOfFirstMember = indexOfLastMember - membersPerPage
  const currentMembers = filteredMembers.slice(indexOfFirstMember, indexOfLastMember)
  const totalPages = Math.ceil(filteredMembers.length / membersPerPage)

  // Gestion de la sélection
  const handleSelectMember = (id) => {
    setSelectedMembers(prev =>
      prev.includes(id)
        ? prev.filter(memberId => memberId !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedMembers.length === currentMembers.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(currentMembers.map(member => member.id))
    }
  }

  // SUPPRIMER UN MEMBRE
  const handleDelete = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) return

    try {
      await api.delete(`/membres/${id}`)
      setMembers(prev => prev.filter(member => member.id !== id))
      setSelectedMembers(prev => prev.filter(memberId => memberId !== id))
      toast.success("Membre supprimé avec succès")
    } catch (error) {
      console.error("Erreur API:", error)
      toast.error("Erreur lors de la suppression du membre")
    }
  }

  // SUPPRIMER PLUSIEURS MEMBRES
  const handleDeleteSelected = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Veuillez sélectionner au moins un membre")
      return
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${selectedMembers.length} membre(s) ?`)) return

    try {
      for (const id of selectedMembers) {
        await api.delete(`/membres/${id}`)
      }
      
      setMembers(prev => prev.filter(member => !selectedMembers.includes(member.id)))
      setSelectedMembers([])
      toast.success(`${selectedMembers.length} membre(s) supprimé(s) avec succès`)
    } catch (error) {
      console.error("Erreur API:", error)
      toast.error("Erreur lors de la suppression des membres")
    }
  }

  const handleView = (id) => {
    navigate(`/membres/${id}`)
  }

  const handleEdit = (id) => {
    navigate(`/membres/${id}/edit`)
  }

  // EXPORTER LES DONNÉES
  const handleExport = async () => {
    try {
      toast.info("Export en cours...")
      
      const headers = ["Nom", "Postnom", "Prénom", "Sexe", "Téléphone", "Adresse", "Date d'inscription"]
      const csvContent = [
        headers.join(","),
        ...filteredMembers.map(member => [
          `"${member.nom || ''}"`,
          `"${member.postnom || ''}"`,
          `"${member.prenom || ''}"`,
          member.sexe || '',
          `"${member.telephone || ''}"`,
          `"${member.adresse || ''}"`,
          formatDate(member.created_at)
        ].join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `membres_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success("Export terminé!")
    } catch (error) {
      console.error("Erreur export:", error)
      toast.error("Erreur lors de l'export")
    }
  }

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible"
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch {
      return "Date invalide"
    }
  }

  // Obtenir l'initiale
  const getInitials = (member) => {
    const firstLetter = member.nom?.charAt(0).toUpperCase() || '?'
    const secondLetter = member.prenom ? member.prenom.charAt(0).toUpperCase() : ''
    return firstLetter + secondLetter
  }

  // Nom complet
  const getFullName = (member) => {
    return `${member.nom || ''} ${member.postnom || ''} ${member.prenom || ''}`.trim()
  }

  // Actualiser les données
  const handleRefresh = () => {
    loadMembers()
  }

  // Obtenir la couleur en fonction du sexe
  const getGenderColor = (sexe) => {
    return sexe === 'M' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-pink-500 to-rose-600'
  }

  return (
    <div className="min-h-screen px-4 py-8 animate-fadeIn">
      {/* Header avec stats */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={24} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-sm">
                  <span className="text-white text-xs font-bold">{members.length}</span>
                </div>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Gestion des Membres
                </h1>
                <p className="text-gray-500">Administration et suivi des membres de l'église</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center gap-2 hover:shadow-sm"
            >
              <RefreshCw size={18} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center gap-2 hover:shadow-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exporter</span>
            </button>
            <button
              onClick={() => navigate("/AddMembrePage")}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2 group"
            >
              <UserPlus size={18} className="group-hover:scale-110 transition-transform" />
              <span>Nouveau Membre</span>
            </button>
          </div>
        </div>

        {/* Cartes statistiques améliorées */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Carte 1: Total Membres */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Membres</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-400 mt-2">Base de données</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          {/* Carte 2: Hommes vs Femmes */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Répartition</p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xl font-bold text-blue-600">{stats.hommes}</p>
                    <p className="text-xs text-gray-500">Hommes</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-pink-600">{stats.femmes}</p>
                    <p className="text-xs text-gray-500">Femmes</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Par sexe</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          {/* Carte 3: Nouveaux ce mois */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Nouveaux</p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xl font-bold text-emerald-600">{stats.nouveauCeMois}</p>
                    <p className="text-xs text-gray-500">Ce mois</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-600">{stats.nouveauCeSemaine}</p>
                    <p className="text-xs text-gray-500">7 derniers jours</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Inscriptions récentes</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center">
                <TrendingUp className="text-emerald-600" size={24} />
              </div>
            </div>
          </div>

          {/* Carte 4: Avec engagements */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Engagements</p>
                <p className="text-3xl font-bold text-amber-600">{stats.avecEngagements}</p>
                <div className="flex items-center gap-2 mt-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <p className="text-xs text-gray-500">Avec engagements actifs</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                <Activity className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres améliorée */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-2" />
                Rechercher un membre
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nom, postnom, prénom, téléphone ou adresse..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/30 transition-all duration-200 hover:bg-gray-50"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-purple-600 transition-colors" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter size={16} className="inline mr-2" />
                Filtrer par sexe
              </label>
              <div className="relative">
                <select
                  value={filterSexe}
                  onChange={(e) => setFilterSexe(e.target.value)}
                  className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/30 transition-all appearance-none"
                >
                  <option value="">Tous les sexes</option>
                  <option value="M">Hommes</option>
                  <option value="F">Femmes</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm("")
                  setFilterSexe("")
                  setSelectedMembers([])
                }}
                className="w-full px-4 py-3.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium hover:shadow-sm"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        </div>

        {/* Actions groupées */}
        {selectedMembers.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4 shadow-sm animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-md">
                  <AlertCircle className="text-white" size={20} />
                </div>
                <div>
                  <p className="font-semibold text-red-900">
                    {selectedMembers.length} membre(s) sélectionné(s)
                  </p>
                  <p className="text-sm text-red-700">
                    Prêt pour une action groupée
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteSelected}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Supprimer la sélection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des membres amélioré */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">Chargement des membres...</p>
              <p className="text-sm text-gray-400 mt-2">Patientez un instant</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="py-4 px-6 text-left">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={selectedMembers.length === currentMembers.length && currentMembers.length > 0}
                            onChange={handleSelectAll}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                          />
                        </div>
                      </th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Membre</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Téléphone</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Adresse</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Date d'inscription</th>
                      <th className="py-4 px-6 text-left text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentMembers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-16 px-6 text-center">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                            <User className="text-gray-400" size={32} />
                          </div>
                          <p className="text-gray-500 text-lg mb-2">Aucun membre trouvé</p>
                          <p className="text-gray-400 max-w-md mx-auto">
                            {searchTerm || filterSexe
                              ? "Aucun membre ne correspond à vos critères de recherche"
                              : "Commencez par ajouter votre premier membre"}
                          </p>
                          {!searchTerm && !filterSexe && (
                            <button
                              onClick={() => navigate("/AddMembrePage")}
                              className="mt-6 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-md"
                            >
                              <Plus size={18} className="inline mr-2" />
                              Ajouter le premier membre
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      currentMembers.map((member) => (
                        <tr 
                          key={member.id} 
                          className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-gray-100/50 transition-all duration-150"
                        >
                          <td className="py-4 px-6">
                            <input
                              type="checkbox"
                              checked={selectedMembers.includes(member.id)}
                              onChange={() => handleSelectMember(member.id)}
                              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
                            />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${getGenderColor(member.sexe)}`}>
                                <span className="font-bold text-white text-sm">{getInitials(member)}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {getFullName(member)}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                                    member.sexe === 'M' 
                                      ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                      : 'bg-pink-100 text-pink-700 border border-pink-200'
                                  }`}>
                                    {member.sexe === 'M' ? 'Homme' : 'Femme'}
                                  </span>
                                  {member.active_engagements_count > 0 && (
                                    <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 font-medium flex items-center gap-1">
                                      <Activity size={10} />
                                      {member.active_engagements_count} engagement(s)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Phone size={16} className="text-gray-400" />
                              <span className="text-gray-700 font-medium">{member.telephone || "Non renseigné"}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {member.adresse ? (
                              <div className="flex items-start gap-2 max-w-xs">
                                <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-700 line-clamp-2">{member.adresse}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Non renseignée</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-gray-400" />
                              <span className="text-gray-700">{formatDate(member.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(member.id)}
                                className="p-2 hover:bg-blue-50 rounded-xl transition-all duration-200 text-blue-600 hover:text-blue-700 hover:shadow-sm"
                                title="Voir détails"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => handleEdit(member.id)}
                                className="p-2 hover:bg-emerald-50 rounded-xl transition-all duration-200 text-emerald-600 hover:text-emerald-700 hover:shadow-sm"
                                title="Modifier"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="p-2 hover:bg-red-50 rounded-xl transition-all duration-200 text-red-600 hover:text-red-700 hover:shadow-sm"
                                title="Supprimer"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination améliorée */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-sm text-gray-500">
                      Affichage de <span className="font-medium">{indexOfFirstMember + 1}</span> à{" "}
                      <span className="font-medium">{Math.min(indexOfLastMember, filteredMembers.length)}</span> sur{" "}
                      <span className="font-medium">{filteredMembers.length}</span> membres
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-10 h-10 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all flex items-center justify-center"
                      >
                        <ChevronDown className="rotate-90 text-gray-600" size={18} />
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i
                        } else {
                          pageNumber = currentPage - 2 + i
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                              currentPage === pageNumber
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                                : 'border border-gray-200 hover:bg-white hover:shadow-sm text-gray-700'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        )
                      })}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-10 h-10 rounded-xl border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white hover:shadow-sm transition-all flex items-center justify-center"
                      >
                        <ChevronDown className="-rotate-90 text-gray-600" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Gestion des Membres - Église
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {members.length} membres enregistrés • Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  )
}