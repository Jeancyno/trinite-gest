import { useState, useEffect, useCallback } from "react"
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Download,
  PieChart,
  BarChart3,
  Smartphone,
  Banknote,
  CreditCard,
  Calendar,
  RefreshCw,
  Search,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  TrendingDown,
  Eye
} from "lucide-react"
import Button from "../../components/ui/Button"
import LoadingCard from "../../components/common/LoadingCard"
import api from "../../api/axios"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Palette de couleurs cohérente
const COLOR_PALETTE = {
  primary: {
    light: "rgba(59, 130, 246, 0.1)",
    DEFAULT: "#3B82F6",
    dark: "#1D4ED8"
  },
  success: {
    light: "rgba(34, 197, 94, 0.1)",
    DEFAULT: "#22C55E",
    dark: "#16A34A"
  },
  warning: {
    light: "rgba(245, 158, 11, 0.1)",
    DEFAULT: "#F59E0B",
    dark: "#D97706"
  },
  danger: {
    light: "rgba(239, 68, 68, 0.1)",
    DEFAULT: "#EF4444",
    dark: "#DC2626"
  },
  purple: {
    light: "rgba(168, 85, 247, 0.1)",
    DEFAULT: "#A855F7",
    dark: "#9333EA"
  },
  pink: {
    light: "rgba(236, 72, 153, 0.1)",
    DEFAULT: "#EC4899",
    dark: "#DB2777"
  }
}

const TIME_RANGES = [
  { id: 'jour', label: 'Aujourd\'hui', color: COLOR_PALETTE.primary.DEFAULT },
  { id: 'semaine', label: 'Cette semaine', color: COLOR_PALETTE.success.DEFAULT },
  { id: 'mois', label: 'Ce mois', color: COLOR_PALETTE.purple.DEFAULT },
  { id: 'annee', label: 'Cette année', color: COLOR_PALETTE.warning.DEFAULT }
]

export default function PaiementDime() {

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

  const [timeRange, setTimeRange] = useState("mois")
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [apiData, setApiData] = useState({
    dimes: [],
    membres: [],
    statistiques: null,
    totalPages: 1,
    currentPage: 1,
    totalItems: 0
  })
  const [error, setError] = useState(null)

  const fetchDimes = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      const params = { page, per_page: 10 }
      if (searchTerm) params.search = searchTerm
      
      console.log("📤 Requête /dimes avec params:", params);
      
      const response = await api.get('/dimes', { params })
      
      console.log("📊 Réponse complète:", response.data);
      
      // IMPORTANT : Correction de la structure de données
      // Laravel paginate() retourne directement les données, pas data.data
      const dimesData = response.data.data || {};
      const dimesList = dimesData.data || dimesData || [];
      
      console.log("📊 Liste des dîmes:", dimesList);
      
      if (response.data.success) {
        setApiData(prev => ({
          ...prev,
          dimes: dimesList,
          totalPages: dimesData.last_page || 1,
          currentPage: dimesData.current_page || page,
          totalItems: dimesData.total || dimesList.length
        }))
      }
    } catch (err) {
      console.error("❌ Erreur fetchDimes:", err);
      console.error("❌ Détails:", err.response?.data);
      setError("Erreur lors du chargement des données")
      toast.error("Erreur lors du chargement des données")
    } finally {
      setIsLoading(false)
    }
  }, [searchTerm])

  const fetchStatistiques = useCallback(async () => {
    try {
      const now = new Date()
      let startDate, endDate
      const yearForData = new Date().getFullYear()

      switch (timeRange) {
        case 'jour':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          break
        case 'semaine':
          const day = now.getDay()
          const diff = now.getDate() - day + (day === 0 ? -6 : 1)
          startDate = new Date(now.setDate(diff))
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(startDate)
          endDate.setDate(startDate.getDate() + 6)
          endDate.setHours(23, 59, 59, 999)
          break
        case 'annee':
          startDate = new Date(yearForData, 0, 1)
          endDate = new Date(yearForData, 11, 31)
          break
        default: // mois
          startDate = new Date(yearForData, now.getMonth(), 1)
          endDate = new Date(yearForData, now.getMonth() + 1, 0)
      }

      const params = {
        debut: startDate.toISOString().split('T')[0],
        fin: endDate.toISOString().split('T')[0]
      }
      
      console.log("📤 Requête /dimes/statistiques avec params:", params);
      
      const response = await api.get('/dimes/statistiques', { params })
      
      console.log("📊 Réponse statistiques:", response.data);
      
      if (response.data.success) {
        setApiData(prev => ({ ...prev, statistiques: response.data.data }))
      }
    } catch (err) {
      console.error("❌ Erreur fetchStatistiques:", err);
      calculateFallbackStats()
    }
  }, [timeRange])

  const fetchMembres = useCallback(async () => {
    try {
      console.log("📤 Requête /membres");
      const response = await api.get('/membres', { params: { per_page: 100 } })
      
      console.log("📊 Réponse membres:", response.data);
      
      if (response.data.success) {
        // Correction : Laravel retourne directement data, pas data.data
        const membresData = response.data.data || {};
        const membresList = membresData.data || membresData || [];
        
        setApiData(prev => ({ 
          ...prev, 
          membres: Array.isArray(membresList) ? membresList : [] 
        }))
      }
    } catch (err) { 
      console.error("❌ Erreur fetchMembres:", err);
    }
  }, [])

  const calculateFallbackStats = useCallback(() => {
    if (apiData.dimes.length === 0) return
    
    // IMPORTANT : Calculer le montant total depuis les colonnes séparées
    const total = apiData.dimes.reduce((s, d) => {
      const montantUSD = parseFloat(d.montant_usd || 0);
      const montantCDF = parseFloat(d.montant_cdf || 0);
      // Pour l'affichage, utiliser la devise principale
      if (d.devise === 'USD') {
        return s + montantUSD;
      } else {
        return s + montantCDF;
      }
    }, 0);
    
    const distinctMembres = new Set(apiData.dimes.map(d => d.membre_id)).size
    const totalMembres = apiData.membres.length
    
    // Calculer l'évolution (simulation)
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const currentMonthDimes = apiData.dimes.filter(d => 
      new Date(d.date_versement).getMonth() === today.getMonth()
    )
    const lastMonthDimes = apiData.dimes.filter(d => 
      new Date(d.date_versement).getMonth() === lastMonth.getMonth()
    )
    
    const currentTotal = currentMonthDimes.reduce((s, d) => s + parseFloat(d.montant_usd || d.montant_cdf || 0), 0)
    const lastTotal = lastMonthDimes.reduce((s, d) => s + parseFloat(d.montant_usd || d.montant_cdf || 0), 0)
    const evolution = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal * 100).toFixed(1) : 100

    setApiData(prev => ({
      ...prev,
      statistiques: {
        totaux: {
          total_percu: total,
          membres_actifs: distinctMembres,
          total_membres: totalMembres,
          taux_participation: totalMembres > 0 ? (distinctMembres / totalMembres) * 100 : 0,
          evolution_pourcentage: parseFloat(evolution),
          moyenne_par_membre: distinctMembres > 0 ? total / distinctMembres : 0,
          transactions_count: prev.dimes.length
        }
      }
    }))
  }, [apiData.dimes, apiData.membres])

  useEffect(() => {
    const init = async () => {
      setIsLoading(true)
      try {
        await Promise.all([fetchDimes(), fetchMembres()])
        await fetchStatistiques()
      } catch (error) {
        console.error("❌ Erreur initialisation:", error);
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    fetchStatistiques()
  }, [timeRange, fetchStatistiques])

  const formatMontant = (dime) => {
    // Utiliser les colonnes séparées USD/CDF
    const montantUSD = parseFloat(dime.montant_usd || 0);
    const montantCDF = parseFloat(dime.montant_cdf || 0);
    
    if (dime.devise === 'USD' && montantUSD > 0) {
      return `${montantUSD.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} USD`;
    } else if (dime.devise === 'CDF' && montantCDF > 0) {
      return `${montantCDF.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} CDF`;
    } else {
      // Fallback pour compatibilité
      const montant = montantUSD > 0 ? montantUSD : montantCDF;
      const devise = montantUSD > 0 ? 'USD' : 'CDF';
      return `${montant.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })} ${devise}`;
    }
  }

  const getMembreNom = (id) => {
    const m = apiData.membres.find(mem => mem.id === id)
    return m ? `${m.prenom || ''} ${m.nom || ''}`.trim() || m.nom_complet || "Membre inconnu" : "Membre inconnu"
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Simulation d'export
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Rapport exporté avec succès !")
    } catch (error) {
      toast.error("Erreur lors de l'export")
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading && apiData.dimes.length === 0) {
    return (
      <div className="p-8">
        <LoadingCard type="grid" count={4} />
        <LoadingCard type="list" count={5} className="mt-6" />
      </div>
    )
  }

  const stats = apiData.statistiques?.totaux || { 
    total_percu: 0, 
    membres_actifs: 0, 
    total_membres: 0,
    taux_participation: 0,
    evolution_pourcentage: 0,
    moyenne_par_membre: 0,
    transactions_count: 0
  }

  // Cartes de statistiques avec une palette cohérente
 // Cartes de statistiques avec USD et CDF séparés
const statCards = [
    {
      title: "Total USD",
      value: `${(stats.total_usd || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`,
      icon: <DollarSign className="text-white" size={24} />,
      color: COLOR_PALETTE.primary,
      trend: apiData.statistiques?.details?.usd?.paiements || 0,
      description: "Contributions en dollars",
      subValue: `${apiData.statistiques?.details?.usd?.paiements || 0} paiements`
    },
    {
      title: "Total CDF",
      value: `${(stats.total_cdf || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} CDF`,
      icon: <Banknote className="text-white" size={24} />,
      color: COLOR_PALETTE.success,
      trend: apiData.statistiques?.details?.cdf?.paiements || 0,
      description: "Contributions en francs congolais",
      subValue: `${apiData.statistiques?.details?.cdf?.paiements || 0} paiements`
    },
    {
      title: "Membres Actifs",
      value: stats.membres_actifs,
      icon: <Users className="text-white" size={24} />,
      color: COLOR_PALETTE.purple,
      subValue: `${stats.total_membres} total`,
      description: "Membres ayant contribué",
      trend: stats.membres_actifs > 0 ? 
        ((stats.membres_actifs / stats.total_membres) * 100).toFixed(1) + "%" : "0%"
    },
    {
      title: "Taux Participation",
      value: `${stats.taux_participation?.toFixed(1) || 0}%`,
      icon: <PieChart className="text-white" size={24} />,
      color: COLOR_PALETTE.warning,
      description: "Pourcentage de membres contributeurs",
      trend: stats.taux_participation > 50 ? "Élevé" : "Moyen"
    }
];

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto px-4 py-6 bg-gradient-to-br from-gray-50 to-white min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Tableau de Bord - Dîmes
          </h1>
          <p className="text-gray-600 mt-2">
            Suivez les contributions et la participation des membres
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={() => {
              fetchDimes()
              fetchStatistiques()
            }} 
            className="flex items-center gap-2 border-gray-300 hover:border-gray-400"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /> 
            Actualiser
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <Download size={18} className="mr-2" /> 
            {isExporting ? "Export en cours..." : "Exporter le rapport"}
          </Button>
        </div>
      </div>

      {/* Période sélectionnée */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Calendar className="text-gray-500" size={20} />
          <span className="text-gray-700 font-medium">Période :</span>
        </div>
        <div className="flex gap-2">
          {TIME_RANGES.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                timeRange === range.id
                  ? 'text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: timeRange === range.id ? range.color : 'transparent'
              }}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section des statistiques */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="w-2 h-6 bg-blue-600 rounded"></div>
          Aperçu des performances
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div 
              key={index} 
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{card.title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">{card.value}</h3>
                  </div>
                  <div 
                    className="p-3 rounded-xl shadow-sm"
                    style={{ backgroundColor: card.color.DEFAULT }}
                  >
                    {card.icon}
                  </div>
                </div>
                
                <div className="space-y-2">
                  {card.subValue && (
                    <p className="text-xs text-gray-500">
                      {card.subValue}
                    </p>
                  )}
                  {card.description && (
                    <p className="text-xs text-gray-400">
                      {card.description}
                    </p>
                  )}
                  {card.trend && (
                    <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border ${
                      typeof card.trend === 'string' && card.trend.includes('%')
                        ? parseFloat(card.trend) > 0
                          ? "text-green-600 bg-green-50 border-green-100"
                          : "text-red-600 bg-red-50 border-red-100"
                        : "text-blue-600 bg-blue-50 border-blue-100"
                    }`}>
                      {typeof card.trend === 'string' && card.trend.includes('%') ? (
                        <>
                          {parseFloat(card.trend) > 0 ? (
                            <TrendingUp size={12} />
                          ) : (
                            <TrendingDown size={12} />
                          )}
                          <span>{card.trend}</span>
                        </>
                      ) : (
                        <>
                          <Eye size={12} />
                          <span>{card.trend}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Barre de progression colorée en bas */}
              <div className="h-1 w-full overflow-hidden">
                <div 
                  className="h-full transition-all duration-500 group-hover:w-full"
                  style={{
                    width: index === 0 ? '100%' : 
                           index === 1 ? `${Math.min(100, (stats.membres_actifs / stats.total_membres) * 100)}%` :
                           index === 2 ? `${Math.min(100, stats.taux_participation)}%` :
                           '60%',
                    backgroundColor: card.color.DEFAULT,
                    opacity: 0.8
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section des transactions */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              Historique des transactions
              <span className="text-sm bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                {apiData.totalItems} enregistrements
              </span>
            </h3>
            <p className="text-gray-500 text-sm mt-1">
              Liste des contributions récentes des membres
            </p>
          </div>
          
          {/* Barre de recherche */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Membre
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Méthode
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Devise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {apiData.dimes.map((dime, index) => (
                <tr 
                  key={dime.id} 
                  className="hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-white transition-all duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
               
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm"
                        style={{
                          background: `linear-gradient(135deg, ${COLOR_PALETTE.primary.DEFAULT}, ${COLOR_PALETTE.purple.DEFAULT})`
                        }}
                      >
                        {getMembreNom(dime.membre_id).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-900 block">
                          {getMembreNom(dime.membre_id)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ID: {dime.membre_id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 text-lg">
                      {formatMontant(dime)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {dime.methode_paiement === 'Mobile Money' ? (
                        <>
                          <Smartphone className="text-blue-500" size={18} />
                          <span className="text-gray-700">Mobile Money</span>
                        </>
                      ) : dime.methode_paiement === 'Carte de crédit' ? (
                        <>
                          <CreditCard className="text-purple-500" size={18} />
                          <span className="text-gray-700">Carte de crédit</span>
                        </>
                      ) : (
                        <>
                          <Banknote className="text-green-500" size={18} />
                          <span className="text-gray-700">{dime.methode_paiement || 'Espèces'}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {new Date(dime.date_versement).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(dime.date_versement).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                      dime.devise === 'USD' 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        dime.devise === 'USD' ? 'bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      {dime.devise || 'USD'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {apiData.totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Affichage de <span className="font-semibold">{apiData.dimes.length}</span> sur{' '}
              <span className="font-semibold">{apiData.totalItems}</span> transactions
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDimes(apiData.currentPage - 1)}
                disabled={apiData.currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Précédent
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, apiData.totalPages) }, (_, i) => {
                  const pageNumber = i + 1
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => fetchDimes(pageNumber)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        apiData.currentPage === pageNumber
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
                {apiData.totalPages > 5 && (
                  <>
                    <span className="px-2 text-gray-400">...</span>
                    <button
                      onClick={() => fetchDimes(apiData.totalPages)}
                      className={`w-8 h-8 rounded-md text-sm font-medium ${
                        apiData.currentPage === apiData.totalPages
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {apiData.totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchDimes(apiData.currentPage + 1)}
                disabled={apiData.currentPage === apiData.totalPages}
                className="flex items-center gap-1"
              >
                Suivant
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer avec info résumé */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h4 className="text-lg font-semibold mb-2">Résumé des performances</h4>
            <p className="text-gray-300 text-sm">
              Le tableau de bord montre une {stats.evolution_pourcentage > 0 ? 'augmentation' : 'diminution'} de{' '}
              <span className="font-bold">{Math.abs(stats.evolution_pourcentage)}%</span> par rapport à la période précédente.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.membres_actifs}</div>
              <div className="text-xs text-gray-300">Membres actifs</div>
            </div>
            <div className="h-8 w-px bg-gray-700"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">{apiData.totalItems}</div>
              <div className="text-xs text-gray-300">Transactions</div>
            </div>
            <div className="h-8 w-px bg-gray-700"></div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {stats.total_percu?.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
              </div>
              <div className="text-xs text-gray-300">Total collecté</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}