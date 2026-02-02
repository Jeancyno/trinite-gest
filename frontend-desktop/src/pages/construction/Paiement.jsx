import { 
  useState, 
  useMemo,
  useEffect 
} from "react"
import { 
  Search, 
  Filter, 
  Download,
  Eye,
  FileText,
  DollarSign,
  Hammer,
  Heart,
  Calendar,
  Users,
  CreditCard,
  ChevronDown,
  TrendingUp,
  Banknote,
  Smartphone,
  Building,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Button from "../../components/ui/Button"
import PaymentDetailPopup from "../../components/popups/PaymentDetailPopup"
import Loading from "../../components/common/Loader"
import LoadingCard from "../../components/common/LoadingCard"

export default function PaymentHistory() {

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
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedType, setSelectedType] = useState("Tous")
  const [selectedMethod, setSelectedMethod] = useState("Toutes")
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  // Données simulées
  const historiquePaiements = [
    {
      id: 1,
      membre_id: 1,
      membre: "Jean Mukendi",
      type_paiement: "Dîme",
      reference_id: 1001,
      montant: 50,
      devise: "USD",
      date_transaction: "2024-03-15",
      methode: "Espèces",
      user_id: 1,
      percepteur: "Admin System",
      created_at: "2024-03-15 10:30:00",
      note: "Dîme mensuelle"
    },
    {
      id: 2,
      membre_id: 2,
      membre: "Marie Kabila",
      type_paiement: "Dîme",
      reference_id: 1002,
      montant: 30,
      devise: "USD",
      date_transaction: "2024-03-10",
      methode: "Mobile Money",
      user_id: 1,
      percepteur: "Admin System",
      created_at: "2024-03-10 14:20:00",
      note: "Via Orange Money"
    },
    {
      id: 3,
      membre_id: 3,
      membre: "Paul Nzambe",
      type_paiement: "Construction",
      reference_id: 2001,
      montant: 200,
      devise: "USD",
      date_transaction: "2024-03-05",
      methode: "Banque",
      user_id: 2,
      percepteur: "Trésorier",
      created_at: "2024-03-05 09:15:00",
      note: "1ère tranche projet"
    },
    {
      id: 4,
      membre_id: 4,
      membre: "Sarah Lubangi",
      type_paiement: "dime",
      reference_id: 3001,
      montant: 100,
      devise: "CDF",
      date_transaction: "2024-03-01",
      methode: "Espèces",
      user_id: 1,
      percepteur: "Admin System",
      created_at: "2024-03-01 16:45:00",
      note: "spéciale"
    },
    {
      id: 5,
      membre_id: 5,
      membre: "David Mbayo",
      type_paiement: "Dîme",
      reference_id: 1003,
      montant: 75,
      devise: "USD",
      date_transaction: "2024-02-28",
      methode: "Mobile Money",
      user_id: 2,
      percepteur: "Trésorier",
      created_at: "2024-02-28 11:10:00",
      note: "M-Pesa"
    },
    {
      id: 6,
      membre_id: 3,
      membre: "Paul Nzambe",
      type_paiement: "Construction",
      reference_id: 2002,
      montant: 150,
      devise: "USD",
      date_transaction: "2024-02-25",
      methode: "Espèces",
      user_id: 1,
      percepteur: "Admin System",
      created_at: "2024-02-25 13:30:00",
      note: "2ème versement"
    },
    {
      id: 7,
      membre_id: 1,
      membre: "Jean Mukendi",
      type_paiement: "construction",
      reference_id: 4001,
      montant: 25,
      devise: "USD",
      date_transaction: "2024-02-20",
      methode: "Espèces",
      user_id: 1,
      percepteur: "Admin System",
      created_at: "2024-02-20 08:45:00",
      note: ""
    },
    {
      id: 8,
      membre_id: 6,
      membre: "Grace Lumbala",
      type_paiement: "Dîme",
      reference_id: 1004,
      montant: 60,
      devise: "CDF",
      date_transaction: "2024-02-18",
      methode: "Banque",
      user_id: 2,
      percepteur: "Trésorier",
      created_at: "2024-02-18 15:20:00",
      note: "Virement bancaire"
    }
  ]

  // Simuler le chargement des données
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // Types de paiements disponibles
  const paiementTypes = ["Dîme", "Construction", "Action de grâce", "Offrande"]
  const methodes = ["Espèces", "Mobile Money", "Banque"]

  // Fonction pour obtenir l'icône selon le type
  const getTypeIcon = (type) => {
    switch(type) {
      case "Dîme":
        return { icon: DollarSign, color: "text-green-600", bg: "bg-green-100" }
      case "Construction":
        return { icon: Hammer, color: "text-amber-600", bg: "bg-amber-100" }
      case "Action de grâce":
        return { icon: Heart, color: "text-red-600", bg: "bg-red-100" }
      case "Offrande":
        return { icon: Banknote, color: "text-blue-600", bg: "bg-blue-100" }
      default:
        return { icon: DollarSign, color: "text-gray-600", bg: "bg-gray-100" }
    }
  }

  // Fonction pour obtenir l'icône de méthode
  const getMethodIcon = (method) => {
    switch(method) {
      case "Espèces":
        return Banknote
      case "Mobile Money":
        return Smartphone
      case "Banque":
        return Building
      default:
        return CreditCard
    }
  }

  // Fonction pour ouvrir le popup
  const openPaymentPopup = (payment) => {
    setSelectedPayment(payment)
    setIsPopupOpen(true)
  }

  // Fonction pour fermer le popup
  const closePaymentPopup = () => {
    setIsPopupOpen(false)
  }

  // Fonction pour exporter
  const handleExport = async () => {
    setIsExporting(true)
    // Simuler l'export
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsExporting(false)
    alert("Export terminé avec succès!")
  }

  // Filtrer les paiements avec useMemo pour l'optimisation
  const filteredPayments = useMemo(() => {
    return historiquePaiements.filter(paiement => {
      // Filtre par recherche
      const searchMatch = 
        paiement.membre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paiement.montant.toString().includes(searchTerm) ||
        paiement.type_paiement.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paiement.percepteur.toLowerCase().includes(searchTerm.toLowerCase()) ||
        paiement.note?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtre par type
      const typeMatch = selectedType === "Tous" || paiement.type_paiement === selectedType
      
      // Filtre par méthode
      const methodMatch = selectedMethod === "Toutes" || paiement.methode === selectedMethod
      
      return searchMatch && typeMatch && methodMatch
    })
  }, [searchTerm, selectedType, selectedMethod])

  // Calculer les statistiques avec useMemo
  const stats = useMemo(() => {
    const total = filteredPayments.reduce((sum, p) => sum + p.montant, 0)
    const byType = filteredPayments.reduce((acc, p) => {
      acc[p.type_paiement] = (acc[p.type_paiement] || 0) + p.montant
      return acc
    }, {})
    const uniqueMembers = new Set(filteredPayments.map(p => p.membre_id)).size

    return {
      total,
      count: filteredPayments.length,
      byType,
      uniqueMembers,
      average: filteredPayments.length > 0 ? total / filteredPayments.length : 0
    }
  }, [filteredPayments])

  if (isLoading) {
    return (
      <div className="animate-fadeIn max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header avec loading */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-64 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-32 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="w-32 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Statistiques avec loading */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-300 rounded w-32"></div>
                  <div className="h-3 bg-gray-100 rounded w-20"></div>
                </div>
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tableau avec loading */}
        <LoadingCard type="list" count={5} />

        {/* Répartition avec loading */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4 animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-6 bg-gray-300 rounded w-24 mb-3"></div>
                <div className="w-full bg-gray-200 rounded-full h-2"></div>
                <div className="h-3 bg-gray-100 rounded w-32 mt-2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Historique des Paiements
          </h1>
          <p className="text-gray-500 mt-1">
            Journal complet de toutes les transactions financières
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            Filtres avancés
            <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loading size="sm" text="Export..." />
            ) : (
              <>
                <Download size={18} />
                Exporter journal
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className=" from-white to-blue-50/50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total transactions</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                ${stats.total.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stats.count} opérations</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <DollarSign className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className=" from-white to-green-50/50 rounded-2xl p-5 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Membres actifs</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {stats.uniqueMembers}
              </p>
              <p className="text-xs text-gray-500 mt-1">ont contribué</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className=" from-white to-purple-50/50 rounded-2xl p-5 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Transactions moyennes</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                ${stats.average.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">par opération</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
        </div>

        <div className=" from-white to-amber-50/50 rounded-2xl p-5 border border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-600 font-medium">Période couverte</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                Fév - Mars 2024
              </p>
              <p className="text-xs text-gray-500 mt-1">2 mois d'activité</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Calendar className="text-amber-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher par membre, type, montant..."
            className="w-full pl-12 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-500">Résultats</p>
          <p className="text-sm font-medium text-gray-900">{filteredPayments.length} transactions</p>
        </div>
      </div>

      {/* Section filtres avancés */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-slideDown">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Filtre par Type */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Type de paiement</p>
              <div className="space-y-2">
                {["Tous", ...paiementTypes].map(type => {
                  const { icon: Icon, bg, color } = getTypeIcon(type)
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type === "Tous" ? "Tous" : type)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedType === type
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedType === type ? 'bg-white/20' : bg}`}>
                        <Icon size={16} className={selectedType === type ? 'text-white' : color} />
                      </div>
                      {type === "Tous" ? "Tous les types" : type}
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Filtre par Méthode */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">Méthode de paiement</p>
              <div className="space-y-2">
                {["Toutes", ...methodes].map(method => {
                  const MethodIcon = getMethodIcon(method)
                  return (
                    <button
                      key={method}
                      onClick={() => setSelectedMethod(method === "Toutes" ? "Toutes" : method)}
                      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        selectedMethod === method
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedMethod === method ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <MethodIcon size={16} className={selectedMethod === method ? 'text-white' : 'text-gray-600'} />
                      </div>
                      {method === "Toutes" ? "Toutes méthodes" : method}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions filtres */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Actions</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedType("Tous")
                      setSelectedMethod("Toutes")
                    }}
                    className="w-full px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    Réinitialiser filtres
                  </button>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Indicateurs de filtres actifs */}
      {(selectedType !== "Tous" || selectedMethod !== "Toutes") && (
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">Filtres actifs :</p>
          {selectedType !== "Tous" && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
              Type: {selectedType}
            </span>
          )}
          {selectedMethod !== "Toutes" && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              Méthode: {selectedMethod}
            </span>
          )}
          <button
            onClick={() => {
              setSelectedType("Tous")
              setSelectedMethod("Toutes")
            }}
            className="text-xs text-red-600 hover:text-red-700 ml-2"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* Tableau d'historique */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header du tableau */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
            <div className="col-span-1"></div>
            <div className="col-span-3">Membre & Type</div>
            <div className="col-span-2">Montant</div>
            <div className="col-span-2">Méthode & Date</div>
            <div className="col-span-2">Percepteur</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
        
        {/* Liste des transactions */}
        <div className="divide-y divide-gray-100">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((paiement) => {
              const { icon: TypeIcon, bg, color } = getTypeIcon(paiement.type_paiement)
              const MethodIcon = getMethodIcon(paiement.methode)
              
              return (
                <div key={paiement.id} className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-gray-50/50 transition-colors">
                  {/* Icône type */}
                  <div className="col-span-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                      <TypeIcon size={18} className={color} />
                    </div>
                  </div>

                  {/* Membre & Type */}
                  <div className="col-span-3">
                    <div>
                      <p className="font-semibold text-gray-900">{paiement.membre}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${bg} ${color}`}>
                          {paiement.type_paiement}
                        </span>
                        <span className="text-xs text-gray-500">
                          Ref: #{paiement.reference_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Montant */}
                  <div className="col-span-2">
                    <div>
                      <p className="font-bold text-gray-900">
                        {paiement.montant} {paiement.devise}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(paiement.date_transaction).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>

                  {/* Méthode & Date */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <MethodIcon size={14} className="text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{paiement.methode}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(paiement.created_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Percepteur */}
                  <div className="col-span-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{paiement.percepteur}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        User ID: {paiement.user_id}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => openPaymentPopup(paiement)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Voir les détails"
                      >
                        <Eye size={16} className="text-gray-600" />
                      </button>
                      <button 
                        className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Générer le reçu"
                      >
                        <FileText size={16} className="text-blue-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="text-gray-400" size={24} />
              </div>
              <p className="text-gray-500">Aucune transaction trouvée</p>
              <p className="text-sm text-gray-400 mt-1">
                Modifiez vos critères de recherche ou de filtres
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {filteredPayments.length} transaction{filteredPayments.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Journal ID: HP-{new Date().getFullYear()}-{String(filteredPayments.length).padStart(4, '0')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total filtré</p>
                <p className="text-lg font-bold text-gray-900">${stats.total.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronLeft size={16} className="text-gray-600" />
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">1</span>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ChevronRight size={16} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Répartition */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Répartition par type de paiement</h3>
          <div className="text-sm text-gray-500">
            {Object.keys(stats.byType).length} types différents
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats.byType).map(([type, montant]) => {
            const { icon: Icon, color } = getTypeIcon(type)
            const percentage = ((montant / stats.total) * 100).toFixed(1)
            
            return (
              <div key={type} className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={color} />
                    <span className="font-medium text-gray-900">{type}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{percentage}%</span>
                </div>
                <p className="text-xl font-bold text-gray-900 mb-1">${montant.toFixed(2)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: color.replace('text-', 'bg-')
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {filteredPayments.filter(p => p.type_paiement === type).length} transactions
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Popup de détails */}
      {selectedPayment && (
        <PaymentDetailPopup 
          payment={selectedPayment} 
          isOpen={isPopupOpen} 
          onClose={closePaymentPopup} 
        />
      )}
    </div>
  )
}