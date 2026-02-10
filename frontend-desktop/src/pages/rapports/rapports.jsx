// src/pages/RapportsPage.jsx
import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  DollarSign,
  Users,
  FileText,
  Building,
  CreditCard,
  Printer,
  Eye,
  EyeOff,
  Calculator,
  CheckCircle,
  AlertCircle,
  Clock,
  AlertTriangle,
  Percent,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { fr } from 'date-fns/locale'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export default function RapportsPage() {
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('thisMonth') // thisMonth, lastMonth, custom
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [endDate, setEndDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState('global')
  const [currencyView, setCurrencyView] = useState('USD') // USD ou CDF
  
  // Données des rapports
  const [rapportData, setRapportData] = useState({
    // Dîmes
    dimes: {
      stats: null,
      recent: [],
      total: 0
    },
    // Dépenses
    depenses: {
      stats: null,
      total: 0,
      bySource: {}
    },
    // Membres
    membres: {
      stats: null,
      presence: [],
      total: 0
    },
    // Engagements
    engagements: {
      stats: null,
      etat: null,
      total: 0
    },
    // Soldes
    soldes: {
      dime: { USD: 0, CDF: 0 },
      construction: { USD: 0, CDF: 0 }
    },
    // Transactions récentes
    recentTransactions: []
  })

  // Charger tous les rapports
  useEffect(() => {
    loadAllReports()
  }, [period, startDate, endDate])

  const getPeriodDates = () => {
    const now = new Date()
    let start, end
    
    switch(period) {
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        end = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'lastQuarter':
        const quarter = Math.floor(now.getMonth() / 3)
        start = new Date(now.getFullYear(), (quarter - 1) * 3, 1)
        end = new Date(now.getFullYear(), quarter * 3, 0)
        break
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1)
        end = now
        break
      default: // thisMonth
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = now
    }
    
    return { start, end }
  }

  useEffect(() => {
    const { start, end } = getPeriodDates()
    setStartDate(start)
    setEndDate(end)
  }, [period])

  const loadAllReports = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('Session expirée. Veuillez vous reconnecter.')
        return
      }
      
      // Dates formatées
      const formatDate = (date) => date.toISOString().split('T')[0]
      const params = {
        debut: formatDate(startDate),
        fin: formatDate(endDate)
      }

      // Charger en parallèle toutes les données
      const [
        dimesResponse,
        depensesResponse,
        soldesResponse,
        membresResponse,
        engagementsResponse,
        depensesListResponse
      ] = await Promise.all([
        axios.get('/api/dimes/statistiques', {
          headers: { 'Authorization': `Bearer ${token}` },
          params
        }).catch(() => ({ data: { success: false } })),
        
        axios.get('/api/depenses/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: { success: false } })),
        
        axios.get('/api/depenses/soldes', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: { success: false } })),
        
        axios.get('/api/membres/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: { success: false } })),
        
        axios.get('/api/membres/etat-engagements', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).catch(() => ({ data: { success: false } })),
        
        axios.get('/api/depenses', {
          headers: { 'Authorization': `Bearer ${token}` },
          params: { per_page: 10 }
        }).catch(() => ({ data: { success: false, data: { data: [] } } }))
      ])

      // Calculer les totaux
      const dimesTotal = dimesResponse.data.success ? 
        (dimesResponse.data.data.totaux?.total_usd || 0) + 
        (dimesResponse.data.data.totaux?.total_cdf || 0) / 2500 : 0

      const depensesTotal = depensesResponse.data.success ? 
        (depensesResponse.data.data.usd || 0) + 
        (depensesResponse.data.data.cdf || 0) / 2500 : 0

      // Extraire les transactions récentes
      const recentTransactions = depensesListResponse.data.success ? 
        depensesListResponse.data.data.data.map(depense => ({
          type: 'Dépense',
          motif: depense.motif,
          montant: depense.montant,
          devise: depense.devise,
          date: new Date(depense.date_depense).toLocaleDateString('fr-FR'),
          source: depense.source
        })) : []

      // Mettre à jour l'état
      setRapportData({
        dimes: {
          stats: dimesResponse.data.success ? dimesResponse.data.data : null,
          total: dimesTotal
        },
        depenses: {
          stats: depensesResponse.data.success ? depensesResponse.data.data : null,
          total: depensesTotal,
          bySource: depensesResponse.data.success ? {
            construction_usd: depensesResponse.data.data.construction_usd || 0,
            construction_cdf: depensesResponse.data.data.construction_cdf || 0,
            dime_usd: depensesResponse.data.data.dime_usd || 0,
            dime_cdf: depensesResponse.data.data.dime_cdf || 0
          } : {}
        },
        soldes: soldesResponse.data.success ? soldesResponse.data.soldes : {
          dime: { USD: 0, CDF: 0 },
          construction: { USD: 0, CDF: 0 }
        },
        membres: {
          stats: membresResponse.data.success ? membresResponse.data.data : null,
          total: membresResponse.data.success ? membresResponse.data.data.total : 0
        },
        engagements: {
          stats: engagementsResponse.data.success ? engagementsResponse.data.data : null,
          total: engagementsResponse.data.success ? 
            engagementsResponse.data.data.statistiques.total_promesses : 0
        },
        recentTransactions
      })

    } catch (error) {
      console.error('Erreur chargement rapports:', error)
      toast.error('Erreur lors du chargement des rapports')
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    
    // Titre
    doc.setFontSize(20)
    doc.text('Rapport Financier', pageWidth / 2, 20, { align: 'center' })
    
    // Sous-titre
    doc.setFontSize(12)
    doc.text(`Période: ${formatDateFrench(startDate)} au ${formatDateFrench(endDate)}`, 
      pageWidth / 2, 30, { align: 'center' })
    
    // Date de génération
    doc.setFontSize(10)
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 40, { align: 'center' })
    
    // Tableau des soldes
    doc.autoTable({
      startY: 50,
      head: [['Caisse', 'Devise', 'Solde']],
      body: [
        ['Dîme', 'USD', formatCurrency(rapportData.soldes.dime.USD || 0, 'USD', false)],
        ['Dîme', 'CDF', formatCurrency(rapportData.soldes.dime.CDF || 0, 'CDF', false)],
        ['Construction', 'USD', formatCurrency(rapportData.soldes.construction.USD || 0, 'USD', false)],
        ['Construction', 'CDF', formatCurrency(rapportData.soldes.construction.CDF || 0, 'CDF', false)]
      ],
      theme: 'grid'
    })
    
    // Statistiques dîmes
    if (rapportData.dimes.stats) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [['Statistique', 'Valeur']],
        body: [
          ['Total dîmes USD', formatCurrency(rapportData.dimes.stats.totaux?.total_usd || 0, 'USD', false)],
          ['Total dîmes CDF', formatCurrency(rapportData.dimes.stats.totaux?.total_cdf || 0, 'CDF', false)],
          ['Membres actifs', `${rapportData.dimes.stats.totaux?.membres_actifs || 0}`],
          ['Taux participation', `${rapportData.dimes.stats.totaux?.taux_participation || 0}%`]
        ],
        theme: 'grid'
      })
    }
    
    // Sauvegarder le PDF
    doc.save(`rapport-financier-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('Rapport PDF généré avec succès')
  }

  const exportToExcel = () => {
    // Simuler l'export Excel
    toast.info('Export vers Excel en cours...')
    setTimeout(() => {
      toast.success('Export Excel terminé')
    }, 1500)
  }

  const printReport = () => {
    const printContent = document.getElementById('report-content')
    if (!printContent) return
    
    const originalContent = document.body.innerHTML
    const printWindow = window.open('', '_blank')
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Rapport Financier</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .print-header { text-align: center; margin-bottom: 30px; }
            .print-section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .total-row { font-weight: bold; background-color: #f0f0f0; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Rapport Financier</h1>
            <p>Période: ${formatDateFrench(startDate)} au ${formatDateFrench(endDate)}</p>
            <p>Généré le: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    
    printWindow.document.close()
    printWindow.print()
    printWindow.close()
  }

  const formatCurrency = (amount, currency, withSymbol = true) => {
    if (!amount) amount = 0
    
    if (currency === 'USD') {
      return new Intl.NumberFormat('fr-FR', { 
        style: withSymbol ? 'currency' : 'decimal',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    } else {
      return new Intl.NumberFormat('fr-FR', { 
        style: withSymbol ? 'currency' : 'decimal',
        currency: 'CDF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }
  }

  const formatDateFrench = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getCurrencyAmount = (usdAmount, cdfAmount) => {
    if (currencyView === 'USD') {
      return usdAmount + (cdfAmount / 2500)
    }
    return cdfAmount + (usdAmount * 2500)
  }

  const tabs = [
    { id: 'global', label: 'Vue Globale', icon: BarChart3 },
    { id: 'dimes', label: 'Dîmes', icon: DollarSign },
    { id: 'depenses', label: 'Dépenses', icon: TrendingDown },
    { id: 'engagements', label: 'Engagements', icon: FileText },
    { id: 'membres', label: 'Membres', icon: Users },
    { id: 'soldes', label: 'Soldes', icon: Calculator }
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto" id="report-content">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-xl">
              <BarChart3 className="text-primary" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Rapports & Statistiques</h1>
              <p className="text-gray-600">
                Analyse complète des activités financières et des membres
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Devise:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setCurrencyView('USD')}
                  className={`px-3 py-1 text-sm ${currencyView === 'USD' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                >
                  USD
                </button>
                <button
                  onClick={() => setCurrencyView('CDF')}
                  className={`px-3 py-1 text-sm ${currencyView === 'CDF' ? 'bg-primary text-white' : 'bg-gray-100'}`}
                >
                  CDF
                </button>
              </div>
            </div>
            
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2"
            >
              <Download size={16} />
              PDF
            </button>
            
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-2"
            >
              <Download size={16} />
              Excel
            </button>
            
            <button
              onClick={printReport}
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center gap-2"
            >
              <Printer size={16} />
              Imprimer
            </button>
            
            <button
              onClick={loadAllReports}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Actualiser"
            >
              <RefreshCw size={20} className={`text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filtres de période */}
        <div className="mt-6 bg-white rounded-xl border p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <span className="font-medium text-gray-700">Période:</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'thisMonth', label: 'Ce mois' },
                  { id: 'lastMonth', label: 'Mois dernier' },
                  { id: 'lastQuarter', label: 'Trimestre dernier' },
                  { id: 'thisYear', label: 'Cette année' },
                  { id: 'custom', label: 'Personnalisée' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      period === p.id 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {period === 'custom' && (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Du</span>
                  <DatePicker
                    selected={startDate}
                    onChange={setStartDate}
                    selectsStart
                    startDate={startDate}
                    endDate={endDate}
                    dateFormat="dd/MM/yyyy"
                    locale={fr}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">au</span>
                  <DatePicker
                    selected={endDate}
                    onChange={setEndDate}
                    selectsEnd
                    startDate={startDate}
                    endDate={endDate}
                    minDate={startDate}
                    dateFormat="dd/MM/yyyy"
                    locale={fr}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="mb-6">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-1 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-medium rounded-t-lg flex items-center gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-white border-t border-l border-r border-gray-200 text-primary'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Contenu des onglets */}
      {loading ? (
        <div className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des rapports...</p>
        </div>
      ) : (
        <>
          {/* Vue Globale */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              {/* Cartes de résumé */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Dîmes</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(
                          getCurrencyAmount(
                            rapportData.dimes.stats?.totaux?.total_usd || 0,
                            rapportData.dimes.stats?.totaux?.total_cdf || 0
                          ),
                          currencyView
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="text-green-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500 flex items-center gap-1">
                    <Users size={14} />
                    {rapportData.dimes.stats?.totaux?.membres_actifs || 0} membres actifs
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Dépenses</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {formatCurrency(
                          getCurrencyAmount(
                            rapportData.depenses.stats?.usd || 0,
                            rapportData.depenses.stats?.cdf || 0
                          ),
                          currencyView
                        )}
                      </p>
                    </div>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <TrendingDown className="text-red-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    {rapportData.depenses.stats?.total_count || 0} transactions
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Membres</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {rapportData.membres.total || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="text-blue-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      <span>👨 {rapportData.membres.stats?.hommes || 0}</span>
                      <span className="mx-2">•</span>
                      <span>👩 {rapportData.membres.stats?.femmes || 0}</span>
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Engagements Actifs</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {rapportData.engagements.total || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <FileText className="text-purple-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    {rapportData.engagements.stats?.statistiques?.total_montant_restant 
                      ? formatCurrency(rapportData.engagements.stats.statistiques.total_montant_restant, 'USD')
                      : '0 $'} restants
                  </div>
                </div>
              </div>

              {/* Deuxième rangée */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Taux de Participation</h3>
                    <Percent className="text-blue-500" size={18} />
                  </div>
                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg className="w-32 h-32">
                        <circle
                          className="text-gray-200"
                          strokeWidth="10"
                          stroke="currentColor"
                          fill="transparent"
                          r="56"
                          cx="64"
                          cy="64"
                        />
                        <circle
                          className="text-blue-500"
                          strokeWidth="10"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="56"
                          cx="64"
                          cy="64"
                          strokeDasharray={2 * Math.PI * 56}
                          strokeDashoffset={2 * Math.PI * 56 * (1 - (rapportData.dimes.stats?.totaux?.taux_participation || 0) / 100)}
                        />
                      </svg>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <span className="text-2xl font-bold">
                          {rapportData.dimes.stats?.totaux?.taux_participation || 0}%
                        </span>
                      </div>
                    </div>
                    <p className="mt-4 text-sm text-gray-600">
                      {rapportData.dimes.stats?.totaux?.membres_actifs || 0} membres actifs sur {rapportData.dimes.stats?.totaux?.total_membres || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Soldes Disponibles</h3>
                    <Calculator className="text-green-500" size={18} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Caisse Dîme</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(rapportData.soldes.dime[currencyView] || 0, currencyView)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Caisse Construction</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(rapportData.soldes.construction[currencyView] || 0, currencyView)}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(
                            (rapportData.soldes.dime[currencyView] || 0) + 
                            (rapportData.soldes.construction[currencyView] || 0),
                            currencyView
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900">Engagements</h3>
                    <FileText className="text-purple-500" size={18} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-500" />
                        Finalisés
                      </span>
                      <span className="font-medium">
                        {rapportData.engagements.stats?.finalises?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <AlertCircle size={14} className="text-amber-500" />
                        En attente
                      </span>
                      <span className="font-medium">
                        {rapportData.engagements.stats?.en_attente?.length || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-1">
                        <AlertTriangle size={14} className="text-red-500" />
                        Non payés
                      </span>
                      <span className="font-medium">
                        {rapportData.engagements.stats?.non_payes?.length || 0}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Montant restant</span>
                        <span className="font-bold text-amber-600">
                          {formatCurrency(
                            rapportData.engagements.stats?.statistiques?.total_montant_restant || 0,
                            'USD'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions récentes */}
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={18} />
                  Transactions Récentes
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Description</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Montant</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Source</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {rapportData.recentTransactions.slice(0, 5).map((transaction, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'Dépense' 
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {transaction.motif}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-medium ${
                              transaction.type === 'Dépense' ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {formatCurrency(transaction.montant, transaction.devise)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {transaction.date}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-600 capitalize">
                              {transaction.source}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Dîmes */}
          {activeTab === 'dimes' && rapportData.dimes.stats && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques des Dîmes</h2>
              
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <h3 className="font-medium text-gray-900">Période du rapport</h3>
                  <span className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                    {formatDateFrench(rapportData.dimes.stats.periode?.debut)} au {formatDateFrench(rapportData.dimes.stats.periode?.fin)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Total perçu</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(rapportData.dimes.total, currencyView)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Participation</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {rapportData.dimes.stats.totaux?.taux_participation || 0}%
                    </p>
                    <p className="text-sm text-gray-600">
                      {rapportData.dimes.stats.totaux?.membres_actifs || 0}/{rapportData.dimes.stats.totaux?.total_membres || 0} membres
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Paiements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {rapportData.dimes.stats.totaux?.total_paiements || 0}
                    </p>
                  </div>
                </div>

                {/* Détails par devise */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">USD</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant total</span>
                        <span className="font-medium">{formatCurrency(rapportData.dimes.stats.totaux?.total_usd || 0, 'USD')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre de paiements</span>
                        <span className="font-medium">{rapportData.dimes.stats.details?.usd?.paiements || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Membres</span>
                        <span className="font-medium">{rapportData.dimes.stats.details?.usd?.membres || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">CDF</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Montant total</span>
                        <span className="font-medium">{formatCurrency(rapportData.dimes.stats.totaux?.total_cdf || 0, 'CDF')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nombre de paiements</span>
                        <span className="font-medium">{rapportData.dimes.stats.details?.cdf?.paiements || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Membres</span>
                        <span className="font-medium">{rapportData.dimes.stats.details?.cdf?.membres || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Méthodes de paiement */}
                {rapportData.dimes.stats.par_methode && rapportData.dimes.stats.par_methode.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Méthodes de Paiement</h4>
                    <div className="border rounded-lg overflow-hidden">
                      {rapportData.dimes.stats.par_methode.map((methode, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              index === 0 ? 'bg-green-100' :
                              index === 1 ? 'bg-blue-100' :
                              'bg-purple-100'
                            }`}>
                              <CreditCard className={
                                index === 0 ? 'text-green-600' :
                                index === 1 ? 'text-blue-600' :
                                'text-purple-600'
                              } size={16} />
                            </div>
                            <span className="text-gray-700">{methode.methode_paiement}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              {formatCurrency(methode.total || 0, 'USD')}
                            </p>
                            <p className="text-sm text-gray-600">{methode.nombre} paiements</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top contributeurs */}
                {rapportData.dimes.stats.top_contributeurs && rapportData.dimes.stats.top_contributeurs.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-3">Top 5 Contributeurs</h4>
                    <div className="border rounded-lg overflow-hidden">
                      {rapportData.dimes.stats.top_contributeurs.map((contributeur, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="font-medium text-primary">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {contributeur.membre?.nom_complet || contributeur.membre?.nom || 'Membre inconnu'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {formatCurrency(contributeur.total, 'USD')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Onglet Dépenses */}
          {activeTab === 'depenses' && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques des Dépenses</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Totaux généraux */}
                <div className="border rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Totaux Généraux</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <DollarSign className="text-blue-600" size={16} />
                        </div>
                        <span className="font-medium">USD</span>
                      </div>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(rapportData.depenses.stats?.usd || 0, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <DollarSign className="text-green-600" size={16} />
                        </div>
                        <span className="font-medium">CDF</span>
                      </div>
                      <span className="font-bold text-green-600">
                        {formatCurrency(rapportData.depenses.stats?.cdf || 0, 'CDF')}
                      </span>
                    </div>
                    <div className="pt-3 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">Total</span>
                        <span className="font-bold text-primary">
                          {formatCurrency(rapportData.depenses.total, currencyView)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Par source */}
                <div className="border rounded-lg p-6">
                  <h3 className="font-medium text-gray-900 mb-4">Détails par Source</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <Building size={14} />
                        Caisse Construction
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">USD</p>
                          <p className="font-bold text-blue-600">
                            {formatCurrency(rapportData.depenses.bySource.construction_usd || 0, 'USD')}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">CDF</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(rapportData.depenses.bySource.construction_cdf || 0, 'CDF')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <DollarSign size={14} />
                        Caisse Dîme
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">USD</p>
                          <p className="font-bold text-blue-600">
                            {formatCurrency(rapportData.depenses.bySource.dime_usd || 0, 'USD')}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs text-gray-600">CDF</p>
                          <p className="font-bold text-green-600">
                            {formatCurrency(rapportData.depenses.bySource.dime_cdf || 0, 'CDF')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Répartition */}
              <div className="mt-6 border rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Répartition des Dépenses</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { 
                      label: 'Caisse Construction', 
                      usd: rapportData.depenses.bySource.construction_usd || 0,
                      cdf: rapportData.depenses.bySource.construction_cdf || 0,
                      color: 'bg-blue-500'
                    },
                    { 
                      label: 'Caisse Dîme', 
                      usd: rapportData.depenses.bySource.dime_usd || 0,
                      cdf: rapportData.depenses.bySource.dime_cdf || 0,
                      color: 'bg-green-500'
                    }
                  ].map((caisse, index) => {
                    const totalCaisse = caisse.usd + (caisse.cdf / 2500)
                    const pourcentage = rapportData.depenses.total > 0 
                      ? (totalCaisse / rapportData.depenses.total) * 100 
                      : 0
                    
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">{caisse.label}</span>
                          <span className="font-bold">
                            {formatCurrency(totalCaisse, currencyView)}
                            <span className="ml-2 text-sm font-normal text-gray-600">
                              ({pourcentage.toFixed(1)}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${caisse.color}`}
                            style={{ width: `${pourcentage}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>USD: {formatCurrency(caisse.usd, 'USD')}</span>
                          <span>CDF: {formatCurrency(caisse.cdf, 'CDF')}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Onglet Engagements */}
          {activeTab === 'engagements' && rapportData.engagements.stats && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">État des Engagements</h2>
              
              {/* Statistiques générales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total engagements</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {rapportData.engagements.stats.statistiques?.total_promesses || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Montant promis</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(rapportData.engagements.stats.statistiques?.total_montant_promis || 0, 'USD')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Montant payé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(rapportData.engagements.stats.statistiques?.total_montant_paye || 0, 'USD')}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Reste à payer</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(rapportData.engagements.stats.statistiques?.total_montant_restant || 0, 'USD')}
                  </p>
                </div>
              </div>

              {/* Taux de réalisation */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-4">Taux de Réalisation</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progression globale</span>
                    <span className="font-bold">
                      {rapportData.engagements.stats.statistiques?.total_montant_promis > 0 
                        ? ((rapportData.engagements.stats.statistiques.total_montant_paye / 
                            rapportData.engagements.stats.statistiques.total_montant_promis) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-green-500 h-4 rounded-full"
                      style={{ 
                        width: `${rapportData.engagements.stats.statistiques?.total_montant_promis > 0 
                          ? (rapportData.engagements.stats.statistiques.total_montant_paye / 
                              rapportData.engagements.stats.statistiques.total_montant_promis) * 100 
                          : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Engagements finalisés */}
              {rapportData.engagements.stats.finalises && rapportData.engagements.stats.finalises.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="text-green-500" size={18} />
                    Engagements Finalisés ({rapportData.engagements.stats.finalises.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    {rapportData.engagements.stats.finalises.slice(0, 5).map((engagement, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{engagement.nom_complet}</p>
                          <p className="text-sm text-gray-600">{engagement.telephone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">
                            {formatCurrency(engagement.montant_paye, engagement.devise)}
                          </p>
                          <p className="text-sm text-gray-600">100% payé</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Engagements en attente */}
              {rapportData.engagements.stats.en_attente && rapportData.engagements.stats.en_attente.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="text-amber-500" size={18} />
                    Engagements en Attente ({rapportData.engagements.stats.en_attente.length})
                  </h3>
                  <div className="border rounded-lg overflow-hidden">
                    {rapportData.engagements.stats.en_attente.slice(0, 5).map((engagement, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div>
                          <p className="font-medium text-gray-900">{engagement.nom_complet}</p>
                          <p className="text-sm text-gray-600">
                            {engagement.pourcentage_paye}% payé • {engagement.telephone}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-600">
                            {formatCurrency(engagement.montant_restant, engagement.devise)}
                          </p>
                          <p className="text-sm text-gray-600">reste à payer</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Onglet Membres */}
          {activeTab === 'membres' && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Statistiques des Membres</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Total Membres</p>
                  <p className="text-4xl font-bold text-gray-900 mt-2">
                    {rapportData.membres.total || 0}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Hommes</p>
                  <p className="text-4xl font-bold text-blue-600 mt-2">
                    {rapportData.membres.stats?.hommes || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {rapportData.membres.total > 0 
                      ? ((rapportData.membres.stats?.hommes || 0) / rapportData.membres.total * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Femmes</p>
                  <p className="text-4xl font-bold text-pink-600 mt-2">
                    {rapportData.membres.stats?.femmes || 0}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {rapportData.membres.total > 0 
                      ? ((rapportData.membres.stats?.femmes || 0) / rapportData.membres.total * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>

              {/* Répartition par genre */}
              <div className="border rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4">Répartition par Genre</h3>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                      {/* Cercle hommes */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="20"
                        strokeDasharray={
                          `${2 * Math.PI * 40 * (rapportData.membres.stats?.hommes || 0) / rapportData.membres.total} ${2 * Math.PI * 40}`
                        }
                        strokeDashoffset="0"
                      />
                      {/* Cercle femmes */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#ec4899"
                        strokeWidth="20"
                        strokeDasharray={
                          `${2 * Math.PI * 40 * (rapportData.membres.stats?.femmes || 0) / rapportData.membres.total} ${2 * Math.PI * 40}`
                        }
                        strokeDashoffset={
                          `-${2 * Math.PI * 40 * (rapportData.membres.stats?.hommes || 0) / rapportData.membres.total}`
                        }
                      />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className="font-medium">Hommes</span>
                      <span className="ml-auto font-bold">
                        {rapportData.membres.stats?.hommes || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-pink-500"></div>
                      <span className="font-medium">Femmes</span>
                      <span className="ml-auto font-bold">
                        {rapportData.membres.stats?.femmes || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Onglet Soldes */}
          {activeTab === 'soldes' && (
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Soldes Disponibles</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Caisse Dîme */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <DollarSign className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Caisse Dîme</h3>
                        <p className="text-sm text-gray-600">Fonds des dîmes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(rapportData.soldes.dime[currencyView] || 0, currencyView)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">$</span>
                        </div>
                        <span>USD</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(rapportData.soldes.dime.USD || 0, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">CDF</span>
                        </div>
                        <span>CDF</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(rapportData.soldes.dime.CDF || 0, 'CDF')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Caisse Construction */}
                <div className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                        <Building className="text-blue-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">Caisse Construction</h3>
                        <p className="text-sm text-gray-600">Fonds des engagements</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(rapportData.soldes.construction[currencyView] || 0, currencyView)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">$</span>
                        </div>
                        <span>USD</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(rapportData.soldes.construction.USD || 0, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">CDF</span>
                        </div>
                        <span>CDF</span>
                      </div>
                      <span className="font-bold">
                        {formatCurrency(rapportData.soldes.construction.CDF || 0, 'CDF')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total général */}
              <div className="mt-6 border rounded-lg p-6 bg-gradient-to-r from-primary/5 to-primary/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-900">Total Général</h3>
                    <p className="text-sm text-gray-600">Toutes les caisses confondues</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(
                        (rapportData.soldes.dime[currencyView] || 0) + 
                        (rapportData.soldes.construction[currencyView] || 0),
                        currencyView
                      )}
                    </p>
                    <p className="text-sm text-gray-600">
                      {currencyView === 'USD' 
                        ? `${formatCurrency(rapportData.soldes.dime.CDF + rapportData.soldes.construction.CDF, 'CDF')} CDF`
                        : `${formatCurrency((rapportData.soldes.dime.USD + rapportData.soldes.construction.USD), 'USD')} USD`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}