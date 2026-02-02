import { useState, useEffect, useCallback } from "react"
import MemberRow from "../../components/cards/MemberRow"
import { Plus, Search, RefreshCcw, AlertCircle } from "lucide-react"
import Button from "../../components/ui/Button"
import LoadingCard from "../../components/common/LoadingCard"

export default function Engagements() {
  const [engagements, setEngagements] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({ usd: 0, cdf: 0, count: 0 })

  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
  const STORAGE_URL = import.meta.env.VITE_STORAGE_URL || 'http://127.0.0.1:8000/storage'

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/promesses/stats`)
      const result = await response.json()
      if (result.success) {
        setStats({
          usd: result.data.usd.total_engage,
          cdf: result.data.cdf.total_engage,
          count: result.data.count_total
        })
      }
    } catch (err) { console.error("Erreur stats:", err) }
  }, [API_URL])
const fetchEngagements = useCallback(async () => {
  setIsLoading(true);
  setError(null);
  try {
    const url = searchTerm 
      ? `${API_URL}/promesses?search=${encodeURIComponent(searchTerm)}`
      : `${API_URL}/promesses`;
      
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      const rawData = result.data.data || [];
      
      const formattedData = rawData.map(p => {
        // Utiliser les montants selon la devise
        const montantTotal = p.devise === 'USD' ? p.montant_total_usd : p.montant_total_cdf;
        const montantPaye = p.devise === 'USD' ? p.montant_paye_usd : p.montant_paye_cdf;

        return {
          id: p.id,
          membre: p.membre_nom_complet,
          photo: p.membre?.photo ? `${STORAGE_URL}/${p.membre.photo}` : null,
          montant_total: parseFloat(montantTotal || 0),
          montant_paye: parseFloat(montantPaye || 0),
          devise: p.devise, // 'USD' ou 'CDF'
          duree_mois: p.duree_mois,
          date_debut: p.date_debut,
          status: p.statut
        };
      });

      setEngagements(formattedData);
      fetchStats();
    }
  } catch (err) {
    setError("Erreur de connexion au serveur");
  } finally {
    setIsLoading(false);
  }
}, [searchTerm, API_URL, STORAGE_URL, fetchStats]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { fetchEngagements() }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, fetchEngagements])

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-center gap-3 text-red-700">
          <AlertCircle size={20} /> <p>{error}</p>
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Suivi des Promesses</h1>
        <Button className="flex items-center gap-2">
          <Plus size={18} /> Nouvel Engagement
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-12 pr-4 py-2 bg-gray-50 rounded-xl focus:ring-2 focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-blue-500 font-bold uppercase">Total USD</p>
            <p className="text-lg font-black">${Number(stats.usd).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-emerald-500 font-bold uppercase">Total CDF</p>
            <p className="text-lg font-black">{Number(stats.cdf).toLocaleString()} FC</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEngagements} disabled={isLoading}>
            <RefreshCcw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <LoadingCard type="list" count={5} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="divide-y divide-gray-100">
            {engagements.length > 0 ? (
              engagements.map((item) => <MemberRow key={item.id} {...item} />)
            ) : (
              <div className="p-12 text-center text-gray-400">Aucun engagement trouvé.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}