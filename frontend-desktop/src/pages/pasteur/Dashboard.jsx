import { useState, useEffect } from "react"
import { 
  Users,
  Hammer,
  Target,
  Coins,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle,
  ArrowDownCircle
} from "lucide-react"
import api from "../../api/axios"
import { toast } from "react-toastify"

import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPie, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'

export default function Dashboard() {

  useEffect(() => {
    const syncData = () => {
      console.log("Synchronisation détectée...");
      if (typeof fetchDashboardData === 'function') {
        fetchDashboardData(); 
      }
    };
  
    window.addEventListener("app-synchronize", syncData);
  
    return () => window.removeEventListener("app-synchronize", syncData);
  }, []);
  
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    membres: { 
      total: 0, 
      hommes: 0, 
      femmes: 0, 
      avec_engagements: 0,
      sans_engagements: 0,
      loaded: false 
    },
    engagements: { 
      total: 0, 
      actives: 0, 
      terminees: 0,
      annulees: 0,
      montant_total: 0, // CHANGÉ : montant_total au lieu de montant_total_usd/montant_total_cdf
      taux_paiement: 0,
      loaded: false 
    },
    dimes: { 
      total_usd: 0,
      total_cdf: 0,
      total_paiements: 0,
      membres_actifs: 0,
      taux_participation: 0,
      loaded: false 
    },
    depenses: { 
      total_usd: 0,
      total_cdf: 0,
      construction_usd: 0,
      construction_cdf: 0,
      dime_usd: 0,
      dime_cdf: 0,
      derniere_date: null,
      loaded: false 
    }
  })
  const [chartData, setChartData] = useState([])
  const [evolutionData, setEvolutionData] = useState([])

  const fetchDashboardData = async () => {
    setLoading(true)
    
    try {
      // Membres
      try {
        const membresRes = await api.get('/membres/stats')
        if (membresRes.data.success) {
          setStats(prev => ({
            ...prev,
            membres: {
              total: membresRes.data.data.total || 0,
              hommes: membresRes.data.data.hommes || 0,
              femmes: membresRes.data.data.femmes || 0,
              avec_engagements: membresRes.data.data.avec_engagements || 0,
              sans_engagements: membresRes.data.data.sans_engagements || 0,
              loaded: true
            }
          }))
        }
      } catch (error) {
        console.log('Membres error:', error.message)
      }
      
      // Promesses (Engagements) - CORRIGÉ pour utiliser montant_total
      try {
        const promessesRes = await api.get('/promesses/stats')
        if (promessesRes.data.success) {
          const data = promessesRes.data.data
          
          // Pour obtenir les stats détaillées
          let actives = 0, terminees = 0, annulees = 0;
          try {
            const listePromesses = await api.get('/promesses?per_page=1000')
            if (listePromesses.data.success && listePromesses.data.data.data) {
              actives = listePromesses.data.data.data.filter(p => p.statut === 'actif').length;
              terminees = listePromesses.data.data.data.filter(p => p.statut === 'termine').length;
              annulees = listePromesses.data.data.data.filter(p => p.statut === 'annule').length;
            }
          } catch (e) {
            console.log('Erreur liste promesses:', e.message)
          }
          
          // CORRECTION : utiliser montant_total comme dans le contrôleur
          setStats(prev => ({
            ...prev,
            engagements: {
              total: data.total || 0,
              actives: actives,
              terminees: terminees,
              annulees: annulees,
              montant_total: data.montant_total || 0, // Utilise montant_total
              taux_paiement: 0, // À calculer si nécessaire
              loaded: true
            }
          }))
        }
      } catch (error) {
        console.log('Promesses error:', error.message)
      }
      
      // Dîmes
      try {
        const dimesRes = await api.get('/dimes/statistiques')
        if (dimesRes.data.success) {
          const data = dimesRes.data.data?.totaux || {}
          
          setStats(prev => ({
            ...prev,
            dimes: {
              total_usd: data.total_usd || 0,
              total_cdf: data.total_cdf || 0,
              total_paiements: data.total_paiements || 0,
              membres_actifs: data.membres_actifs || 0,
              taux_participation: data.taux_participation || 0,
              loaded: true
            }
          }))
        }
      } catch (error) {
        console.log('Dîmes error:', error.message)
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
      
      // Dépenses
      // Dépenses
// Dépenses
// Dépenses
try {
  const depensesRes = await api.get('/depenses/stats')
  if (depensesRes.data.success) {
    const d = depensesRes.data.data;
    
    // On crée l'objet proprement
    const total_usd = parseFloat(d.usd || 0);
    const total_cdf = parseFloat(d.cdf || 0);

    setStats(prev => ({
      ...prev,
      depenses: {
        ...prev.depenses, // On garde les autres champs
        total_usd: total_usd,
        total_cdf: total_cdf,
        // On s'assure que construction et dime ne sont pas NaN
        construction_usd: parseFloat(d.construction_usd || 0),
        construction_cdf: parseFloat(d.construction_cdf || 0),
        dime_usd: parseFloat(d.dime_usd || 0),
        dime_cdf: parseFloat(d.dime_cdf || 0),
        derniere_date: d.derniere_date || null,
        loaded: true
      }
    }));
  }
} catch (error) {
  console.error('Erreur:', error);
}  
      // Préparer les données pour les graphiques
      prepareChartData()
      
      toast.success('📊 Données actualisées')
      
    } catch (error) {
      console.error('Dashboard error:', error)
      toast.error('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const prepareChartData = () => {
    // Calculer les totaux en USD équivalent (1 USD = 2500 CDF)
    const tauxChange = 2500;
    
    const totalDimesUSD = stats.dimes.total_usd + (stats.dimes.total_cdf / tauxChange);
    const totalDepensesUSD = stats.depenses.total_usd + (stats.depenses.total_cdf / tauxChange);
    
    // CORRECTION : utiliser stats.engagements.montant_total directement
    const totalEngagementsUSD = stats.engagements.montant_total || 0;
    
    // Données pour le graphique à barres
    const chartData = [
      { 
        name: 'Membres', 
        total: stats.membres.total,
        hommes: stats.membres.hommes,
        femmes: stats.membres.femmes,
        color: '#3B82F6'
      },
      { 
        name: 'Engagements', 
        total: stats.engagements.total,
        montant_usd: totalEngagementsUSD, // Utilise montant_total
        color: '#10B981'
      },
      { 
        name: 'Dîmes', 
        montant_usd: totalDimesUSD,
        paiements: stats.dimes.total_paiements,
        color: '#F59E0B'
      },
      { 
        name: 'Dépenses', 
        montant_usd: totalDepensesUSD,
        construction_usd: stats.depenses.construction_usd + (stats.depenses.construction_cdf / tauxChange),
        dime_usd: stats.depenses.dime_usd + (stats.depenses.dime_cdf / tauxChange),
        color: '#EF4444'
      }
    ]
    
    setChartData(chartData)
    
    // Données pour l'évolution (6 derniers mois)
    const evolution = [
      { mois: 'Jan', engagements: 500, dimes: 200, depenses: 100 },
      { mois: 'Fév', engagements: 800, dimes: 350, depenses: 150 },
      { mois: 'Mar', engagements: 1200, dimes: 500, depenses: 200 },
      { mois: 'Avr', engagements: 900, dimes: 400, depenses: 180 },
      { mois: 'Mai', engagements: 1500, dimes: 600, depenses: 250 },
      { mois: 'Juin', 
        engagements: totalEngagementsUSD || 0, 
        dimes: totalDimesUSD || 0,
        depenses: totalDepensesUSD || 0 
      },
    ]
    
    setEvolutionData(evolution)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!loading) {
      prepareChartData()
    }
  }, [stats])

  // Fonctions de formatage
  const formatCurrency = (amount, devise = 'USD') => {
    if (devise === 'CDF') {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'CDF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount).replace('CDF', 'FC');
    }
    
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  const formatDoubleCurrency = (montantUSD, montantCDF) => {
    return (
      <div className="flex flex-col gap-1">
        <span className="font-semibold text-gray-900">{formatCurrency(montantUSD, 'USD')}</span>
        <span className="text-sm text-gray-600">{formatCurrency(montantCDF, 'CDF')}</span>
      </div>
    )
  }

  const formatPercentage = (value) => {
    return `${parseFloat(value).toFixed(1)}%`
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-xl"></div>
        </div>
        <p className="mt-6 text-gray-600 font-medium">Chargement des données...</p>
        <p className="text-sm text-gray-400 mt-2">Veuillez patienter</p>
      </div>
    )
  }
console.log("🖥️ État final des dépenses avant affichage:", stats.depenses);
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header avec gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-blue-50 p-6 border border-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full -translate-y-32 translate-x-32"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
              <p className="text-gray-600 mt-2">
                Vue d'ensemble des statistiques et performances
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <button
                onClick={fetchDashboardData}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-primary rounded-xl font-medium hover:bg-gray-50 transition-all duration-300 border border-primary/20 shadow-sm"
              >
                <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Carte Membres */}
        <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="text-white" size={26} />
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              stats.membres.total > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {stats.membres.total > 0 ? <TrendingUp size={12} className="inline mr-1" /> : ''}
              Total
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Membres inscrits</h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">{stats.membres.total}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hommes</span>
              <span className="font-semibold text-blue-600">{stats.membres.hommes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Femmes</span>
              <span className="font-semibold text-pink-600">{stats.membres.femmes}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Avec engagements</span>
                <span className="font-medium">{stats.membres.avec_engagements}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Engagements - UTILISE montant_total */}
        <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Hammer className="text-white" size={26} />
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              stats.engagements.actives > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {stats.engagements.actives > 0 ? <TrendingUp size={12} className="inline mr-1" /> : ''}
              Actifs
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Engagements</h3>
          <p className="text-3xl font-bold text-gray-900 mb-4">{stats.engagements.actives}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Montant total</span>
              <span className="font-semibold text-green-600">{formatCurrency(stats.engagements.montant_total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Taux paiement</span>
              <span className="font-semibold text-purple-600">{formatPercentage(stats.engagements.taux_paiement)}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Total engagements</span>
                <span className="font-medium">{stats.engagements.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Dîmes */}
        <div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Coins className="text-white" size={26} />
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              stats.dimes.total_usd > 0 || stats.dimes.total_cdf > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {stats.dimes.total_usd > 0 || stats.dimes.total_cdf > 0 ? <TrendingUp size={12} className="inline mr-1" /> : ''}
              Total
            </div>
          </div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Dîmes collectées</h3>
          <div className="mb-4">
            {formatDoubleCurrency(stats.dimes.total_usd, stats.dimes.total_cdf)}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Paiements</span>
              <span className="font-semibold text-amber-600">{stats.dimes.total_paiements}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Membres actifs</span>
              <span className="font-semibold text-blue-600">{stats.dimes.membres_actifs}</span>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Taux participation</span>
                <span className="font-medium">{formatPercentage(stats.dimes.taux_participation)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Carte Dépenses */}
       {/* Carte Dépenses avec Double Devise */}
<div className="group bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
  <div className="flex items-start justify-between mb-4">
    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
      <ArrowDownCircle className="text-white" size={26} />
    </div>
    <div className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      Sorties totales
    </div>
  </div>
  
  <h3 className="text-sm font-medium text-gray-500 mb-2">Dépenses globales</h3>
  
  {/* Affichage du TOTAL USD et CDF */}
  <div className="mb-6 py-2">
    {formatDoubleCurrency(stats.depenses.total_usd, stats.depenses.total_cdf)}
  </div>

  <div className="space-y-4 border-t border-gray-100 pt-4">
    {/* Détail Construction */}
    <div className="flex justify-between items-start">
      <span className="text-xs text-gray-500 font-medium uppercase">Construction</span>
      <div className="text-right">
        <div className="text-sm font-semibold text-orange-600">
          {formatCurrency(stats.depenses.construction_usd, 'USD')}
        </div>
        <div className="text-[10px] text-gray-400">
          {formatCurrency(stats.depenses.construction_cdf, 'CDF')}
        </div>
      </div>
    </div>

    {/* Détail Dîmes */}
    <div className="flex justify-between items-start">
      <span className="text-xs text-gray-500 font-medium uppercase">Dîmes (Dépense)</span>
      <div className="text-right">
        <div className="text-sm font-semibold text-purple-600">
          {formatCurrency(stats.depenses.dime_usd, 'USD')}
        </div>
        <div className="text-[10px] text-gray-400">
          {formatCurrency(stats.depenses.dime_cdf, 'CDF')}
        </div>
      </div>
    </div>
  </div>
</div>
      </div>

      {/* Section graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique à barres - Comparaison */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Comparaison des données (en USD équivalent)</h2>
              <p className="text-sm text-gray-500">Vue d'ensemble des quatre catégories</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="text-blue-600" size={20} />
            </div>
          </div>
          
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" />
                <YAxis 
                  stroke="#6B7280" 
                  tickFormatter={(value) => `$${value.toLocaleString('fr-FR')}`}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'montant_usd' || name === 'construction_usd' || name === 'dime_usd') {
                      return [`$${value.toLocaleString('fr-FR', {minimumFractionDigits: 0})}`, name.replace('_usd', '')];
                    }
                    return [value, name];
                  }}
                  contentStyle={{ 
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'white'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="total" 
                  name="Total Membres" 
                  fill="#3B82F6" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="montant_usd" 
                  name="Montant (USD)" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="paiements" 
                  name="Paiements Dîmes" 
                  fill="#F59E0B" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Membres</p>
                <p className="font-bold text-gray-900">{stats.membres.total}</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Engagements actifs</p>
                <p className="font-bold text-gray-900">{stats.engagements.actives}</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Dîmes total</p>
                <p className="font-bold text-gray-900">{formatCurrency(stats.dimes.total_usd + (stats.dimes.total_cdf / 2500))}</p>
              </div>
              <div className="text-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Dépenses total</p>
                <p className="font-bold text-gray-900">{formatCurrency(stats.depenses.total_usd + (stats.depenses.total_cdf / 2500))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Graphique d'évolution */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Évolution mensuelle (USD)</h2>
              <p className="text-sm text-gray-500">Tendance sur 6 mois</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Activity className="text-green-600" size={20} />
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mois" stroke="#6B7280" />
                <YAxis 
                  stroke="#6B7280" 
                  tickFormatter={(value) => `$${value.toLocaleString('fr-FR', {minimumFractionDigits: 0})}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString('fr-FR', {minimumFractionDigits: 0})}`, 'Montant']}
                  contentStyle={{ 
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    backgroundColor: 'white'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="engagements" 
                  name="Engagements" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="dimes" 
                  name="Dîmes" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="depenses" 
                  name="Dépenses" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="text-green-600" size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagements ce mois</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(evolutionData[evolutionData.length - 1]?.engagements || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Coins className="text-amber-600" size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dîmes ce mois</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(evolutionData[evolutionData.length - 1]?.dimes || 0)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <ArrowDownCircle className="text-red-600" size={16} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dépenses ce mois</p>
                  <p className="font-bold text-gray-900">
                    {formatCurrency(evolutionData[evolutionData.length - 1]?.depenses || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section détails par devise - MODIFIÉ pour enlever les engagements */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Détails par devise</h2>
            <p className="text-sm text-gray-500">Répartition USD vs CDF (Dîmes et Dépenses seulement)</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <DollarSign className="text-purple-600" size={20} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dîmes par devise */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Dîmes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                <span className="text-gray-600">USD</span>
                <div className="text-right">
                  <p className="font-bold text-amber-700">{formatCurrency(stats.dimes.total_usd, 'USD')}</p>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="text-gray-600">CDF</span>
                <div className="text-right">
                  <p className="font-bold text-yellow-700">{formatCurrency(stats.dimes.total_cdf, 'CDF')}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dépenses par devise */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Dépenses</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="text-gray-600">USD</span>
                <div className="text-right">
                  <p className="font-bold text-red-700">{formatCurrency(stats.depenses.total_usd, 'USD')}</p>
                  <div className="text-xs text-gray-500">
                    <div>Construction: {formatCurrency(stats.depenses.construction_usd, 'USD')}</div>
                    <div>Dîmes: {formatCurrency(stats.depenses.dime_usd, 'USD')}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                <span className="text-gray-600">CDF</span>
                <div className="text-right">
                  <p className="font-bold text-pink-700">{formatCurrency(stats.depenses.total_cdf, 'CDF')}</p>
                  <div className="text-xs text-gray-500">
                    <div>Construction: {formatCurrency(stats.depenses.construction_cdf, 'CDF')}</div>
                    <div>Dîmes: {formatCurrency(stats.depenses.dime_cdf, 'CDF')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Note sur le taux de change */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="text-center text-sm text-gray-500">
            <p>Note: Taux de change utilisé pour les équivalents USD: 1 USD = 2 500 FC</p>
            <p className="mt-1">Engagements: montant total affiché sans séparation par devise</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-100">
        <p>Données mises à jour en temps réel • Taux de change: 1 USD = 2 500 FC • Système opérationnel</p>
      </div>
    </div>
  )
}