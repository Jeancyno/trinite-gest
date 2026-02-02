// EngagementForm.jsx - Version finale avec redirection paiement
import { useState, useEffect } from "react"
import { 
  User, Phone, DollarSign, Calendar, 
  Clock, AlertCircle, CheckCircle, X,
  Loader2, Church, Heart, CreditCard
} from "lucide-react"
import api from "../../api/axios"
import { toast } from "react-toastify"

// Composants
import CreateMemberPopup from "../../components/popups/CreateMemberPopup"
import PendingEngagementPopup from "../../components/popups/PendingEngagementPopup"
import SuccessPopup from "../../components/popups/SuccessPopup"

function EngagementForm() {
  // États
  const [formData, setFormData] = useState({
    telephone: "",
    montant_total: "",
    devise: "USD",
    duree_mois: 12,
    date_debut: new Date().toISOString().split('T')[0],
    observation: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [checkingMember, setCheckingMember] = useState(false)
  const [memberInfo, setMemberInfo] = useState(null)
  const [showCreateMember, setShowCreateMember] = useState(false)
  const [showPendingPopup, setShowPendingPopup] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [pendingEngagement, setPendingEngagement] = useState(null)
  const [memberId, setMemberId] = useState(null)

  // Vérifier le membre quand le téléphone change
  useEffect(() => {
const checkMember = async () => {
  const cleanedPhone = formData.telephone.replace(/\D/g, '')
  if (cleanedPhone.length >= 9) {
    setCheckingMember(true)
    try {
      const response = await api.get(`/promesses/pending-public/${cleanedPhone}`)
      const data = response.data
      
      if (data.membre_exists) {
        setMemberInfo({
          id: data.membre_id,
          nom: data.membre_nom,
          telephone: formData.telephone
        })
        setMemberId(data.membre_id)
        
        // SEULEMENT BLOQUER SI has_pending = true
        if (data.has_pending) {
          setPendingEngagement(data.data)
          setShowPendingPopup(true)
        } else {
          // Si est_completement_paye = true, on peut créer un NOUVEL engagement
          setPendingEngagement(null)
          setShowPendingPopup(false)
          
          // Optionnel: afficher un message si ancien engagement payé
          if (data.est_completement_paye) {
            toast.info("Ancien engagement complètement payé. Vous pouvez créer un nouveau.")
          }
        }
      } else {
        setMemberInfo(null)
        setMemberId(null)
        setPendingEngagement(null)
        setShowPendingPopup(false)
      }
    } catch (error) {
      console.error("Erreur vérification:", error)
      toast.error("Erreur lors de la vérification du numéro")
    } finally {
      setCheckingMember(false)
    }
  }
}
    const timeoutId = setTimeout(checkMember, 800)
    return () => clearTimeout(timeoutId)
  }, [formData.telephone])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

const handlePhoneChange = (e) => {
  let value = e.target.value
  let cleaned = value.replace(/\D/g, '')
  
  // Limiter à 12 chiffres maximum (243 + 9 chiffres)
  cleaned = cleaned.slice(0, 12)
  
  // Si l'utilisateur efface tout
  if (cleaned === '') {
    setFormData(prev => ({ ...prev, telephone: '' }))
    return
  }
  
  let formatted = ''
  
  // Format international: +243 XX XXX XXXX
  if (cleaned.startsWith('243')) {
    formatted = '+243'
    if (cleaned.length > 3) {
      formatted += ' ' + cleaned.slice(3, 5)
      if (cleaned.length > 5) {
        formatted += ' ' + cleaned.slice(5, 8)
        if (cleaned.length > 8) {
          formatted += ' ' + cleaned.slice(8, 12)
        }
      }
    }
  } 
  // Format local: 0XX XXX XXXX
  else {
    // Si 9 chiffres sans 0, c'est probablement un format local
    if (!cleaned.startsWith('0') && cleaned.length <= 9) {
      cleaned = '0' + cleaned.slice(0, 9)
    }
    
    if (cleaned.startsWith('0')) {
      formatted = '0'
      if (cleaned.length > 1) {
        formatted += cleaned.slice(1, 3)
        if (cleaned.length > 3) {
          formatted += ' ' + cleaned.slice(3, 6)
          if (cleaned.length > 6) {
            formatted += ' ' + cleaned.slice(6, 10)
          }
        }
      }
    } else {
      // Garder tel quel si format non reconnu
      formatted = cleaned
    }
  }
  
  setFormData(prev => ({ ...prev, telephone: formatted }))
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.telephone) {
      toast.error("Le numéro de téléphone est obligatoire")
      return
    }
    if (!formData.montant_total || parseFloat(formData.montant_total) <= 0) {
      toast.error("Veuillez saisir un montant valide")
      return
    }
    if (!memberInfo) {
      setShowCreateMember(true)
      return
    }
    if (pendingEngagement) {
      setShowPendingPopup(true)
      return
    }
    await submitEngagement()
  }

  const submitEngagement = async () => {
    setLoading(true)
    try {
      const engagementData = {
        membre_id: memberId,
        montant_total: parseFloat(formData.montant_total),
        devise: formData.devise,
        duree_mois: parseInt(formData.duree_mois),
        date_debut: formData.date_debut,
        observation: formData.observation || null
      }
      const response = await api.post("/promesses/public/", engagementData)
      if (response.data.success) {
        setShowSuccessPopup(true)
        setTimeout(() => { resetForm() }, 30000)
        toast.success("Engagement créé avec succès !")
      } else {
        toast.error(response.data.message || "Erreur lors de la création")
      }
    } catch (error) {
      console.error("Erreur création engagement:", error)
      toast.error("Erreur lors de la création de l'engagement")
    } finally {
      setLoading(false)
    }
  }

  const handleMemberCreated = (newMember) => {
    setMemberInfo({
      id: newMember.id,
      nom: newMember.nom,
      telephone: newMember.telephone
    })
    setMemberId(newMember.id)
    setShowCreateMember(false)
    toast.success("Membre créé avec succès !")
  }

  const resetForm = () => {
    setFormData({
      telephone: "",
      montant_total: "",
      devise: "USD",
      duree_mois: 12,
      date_debut: new Date().toISOString().split('T')[0],
      observation: ""
    })
    setMemberInfo(null)
    setMemberId(null)
    setPendingEngagement(null)
    setShowSuccessPopup(false)
  }

  // --- LOGIQUE DE PAIEMENT MODIFIÉE ---
  const handlePayerEngagement = () => {
    if (pendingEngagement && pendingEngagement.id) {
      // Redirection vers ta route de paiement avec l'ID de l'engagement
      window.location.href = `/public/engagement`;
    } else {
      toast.error("Impossible de récupérer les informations de paiement.");
    }
  }

  const handleCreateNewEngagement = () => {
    setShowPendingPopup(false)
    setPendingEngagement(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
              <Church className="text-white" size={48} />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Formulaire d'Engagement</h1>
          <p className="text-gray-600">Soutenez notre projet de construction avec votre engagement</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-3">
            <div className="md:col-span-2 p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone size={16} /> Numéro de téléphone *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handlePhoneChange}
                      required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Format exigé:081 234 5678"
                      disabled={checkingMember}
                    />
                    {checkingMember && (
                      <div className="absolute right-3 top-3">
                        <Loader2 className="animate-spin text-blue-500" size={20} />
                      </div>
                    )}
                  </div>
                  
                  {memberInfo && !checkingMember && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl animate-fadeIn">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="text-green-600" size={20} />
                        <div>
                          <p className="font-medium text-green-800">{memberInfo.nom}</p>
                          <p className="text-sm text-green-600">
                            Membre trouvé {pendingEngagement && "• Engagement en cours"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <DollarSign size={16} /> Montant total
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        name="montant_total"
                        value={formData.montant_total}
                        onChange={handleChange}
                        min="5"
                        required
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-l-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={pendingEngagement}
                      />
                      <select
                        name="devise"
                        value={formData.devise}
                        onChange={handleChange}
                        className="px-4 py-3 bg-gray-100 border border-gray-200 border-l-0 rounded-r-xl"
                        disabled={pendingEngagement}
                      >
                        <option value="USD">USD</option>
                        <option value="CDF">CDF</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Clock size={16} /> Durée (mois)
                    </label>
                    <select
                      name="duree_mois"
                      value={formData.duree_mois}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={pendingEngagement}
                    >
                      {[1, 3, 6, 12, 24].map(m => <option key={m} value={m}>{m} mois</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar size={16} /> Date de début
                  </label>
                  <input
                    type="date"
                    name="date_debut"
                    value={formData.date_debut}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={pendingEngagement}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 text-sm">Observation (optionnel)</label>
                  <textarea
                    name="observation"
                    value={formData.observation}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={pendingEngagement}
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading || checkingMember || pendingEngagement}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : pendingEngagement ? <AlertCircle size={20} /> : <Heart size={20} />}
                    <span>{loading ? "Création..." : pendingEngagement ? "Engagement en cours" : "Créer mon engagement"}</span>
                  </button>
                  
                  {pendingEngagement && (
                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        onClick={handleCreateNewEngagement}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Créer quand même un nouvel engagement
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-gradient-to-b from-blue-50 to-purple-50 p-6 md:p-8 border-l border-gray-200">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    <Church className="inline mr-2" size={20} /> Construction
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2"><CheckCircle className="text-green-500 mt-0.5" size={16} /> <span>Aidez à construire notre église</span></li>
                    <li className="flex items-start gap-2"><CheckCircle className="text-green-500 mt-0.5" size={16} /> <span>Suivi régulier de vos dons</span></li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-600 mt-0.5" size={18} />
                    <p className="text-sm text-amber-800">Un seul engagement actif à la fois. Veuillez finaliser le précédent avant d'en créer un nouveau.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateMemberPopup
        isOpen={showCreateMember}
        onClose={() => setShowCreateMember(false)}
        onMemberCreated={handleMemberCreated}
        defaultPhone={formData.telephone}
      />

      <PendingEngagementPopup
        isOpen={showPendingPopup}
        onClose={() => setShowPendingPopup(false)}
        engagement={pendingEngagement}
        onPayer={handlePayerEngagement}
      />

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => { resetForm(); setShowSuccessPopup(false); }}
      />
    </div>
  )
}

export default EngagementForm;