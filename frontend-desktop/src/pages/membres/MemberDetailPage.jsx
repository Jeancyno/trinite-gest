import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  ArrowLeft,
  Clock,
  FileText,
  DollarSign,
  Shield,
  Mail,
  Home,
  Activity
} from "lucide-react"
import api from "../../api/axios"
import { toast } from "react-toastify"

export default function MemberDetailPage() {

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
  const { id } = useParams()
  const navigate = useNavigate()
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPromesses: 0,
    totalPaiements: 0,
    promessesEnCours: 0
  })

  useEffect(() => {
    loadMember()
  }, [id])

  const loadMember = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/membres/${id}`)
      setMember(response.data.data || response.data)
      
      // Calculer les statistiques
      const promesses = response.data.data?.promesses || []
      const paiements = response.data.data?.paiements || []
      
      setStats({
        totalPromesses: promesses.length,
        totalPaiements: paiements.length,
        promessesEnCours: promesses.filter(p => !p.paye).length
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement du membre")
      navigate("/membres")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Membre non trouvé</p>
      </div>
    )
  }

  const getFullName = () => {
    return `${member.nom || ''} ${member.postnom || ''} ${member.prenom || ''}`.trim()
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Non disponible"
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header avec navigation */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/membres")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour à la liste</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                member.sexe === 'M' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'
              }`}>
                <span className="text-2xl font-bold">
                  {member.nom?.charAt(0) || '?'}{member.prenom?.charAt(0) || ''}
                </span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {getFullName()}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    member.sexe === 'M' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-pink-100 text-pink-700'
                  }`}>
                    {member.sexe === 'M' ? 'Homme' : 'Femme'}
                  </span>
                  <span className="text-gray-500 text-sm">
                    ID: {member.id}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => navigate(`/membres/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                <Edit size={18} />
                Modifier
              </button>
            </div>
          </div>
        </div>

        {/* Cartes statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Promesses totales</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalPromesses}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Paiements totales</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.totalPaiements}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <DollarSign className="text-emerald-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Promesses en cours</p>
                <p className="text-3xl font-bold text-amber-600">{stats.promessesEnCours}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Clock className="text-amber-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Informations personnelles */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Informations personnelles
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Nom</p>
                  <p className="font-medium text-gray-900">{member.nom || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Postnom</p>
                  <p className="font-medium text-gray-900">{member.postnom || "Non renseigné"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Prénom</p>
                  <p className="font-medium text-gray-900">{member.prenom || "Non renseigné"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Sexe</p>
                  <p className="font-medium text-gray-900">
                    {member.sexe === 'M' ? 'Homme' : member.sexe === 'F' ? 'Femme' : 'Non spécifié'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <Phone size={16} />
                  Téléphone
                </p>
                <p className="font-medium text-gray-900">{member.telephone || "Non renseigné"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <MapPin size={16} />
                  Adresse
                </p>
                <p className="font-medium text-gray-900">{member.adresse || "Non renseignée"}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-2">
                  <Calendar size={16} />
                  Date d'inscription
                </p>
                <p className="font-medium text-gray-900">{formatDate(member.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Activités récentes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity size={20} />
              Activités récentes
            </h2>
            
            <div className="space-y-4">
              {/* Promesses récentes */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Dernières promesses</h3>
                {member.promesses && member.promesses.length > 0 ? (
                  <div className="space-y-3">
                    {member.promesses.slice(0, 3).map((promesse) => (
                      <div key={promesse.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{promesse.montant} $</p>
                            <p className="text-sm text-gray-500">{promesse.description}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            promesse.paye ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {promesse.paye ? 'Payé' : 'En attente'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune promesse enregistrée</p>
                )}
              </div>

              {/* Paiements récents */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Derniers paiements</h3>
                {member.paiements && member.paiements.length > 0 ? (
                  <div className="space-y-3">
                    {member.paiements.slice(0, 3).map((paiement) => (
                      <div key={paiement.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{paiement.montant} $</p>
                            <p className="text-sm text-gray-500">
                              {paiement.type} • {formatDate(paiement.date_paiement)}
                            </p>
                          </div>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                            {paiement.methode}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">Aucun paiement enregistré</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}