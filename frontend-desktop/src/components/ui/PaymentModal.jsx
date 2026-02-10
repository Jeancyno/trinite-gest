import { useState, useEffect } from "react"
import { X, DollarSign, Calendar, AlertCircle } from "lucide-react"
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import api from "../../api/axios"

export default function PaymentModal({ open, onClose, userRole, membrePreSelectionne, onSuccess }) {
  // 1. Normalisation du rôle
  const roleClean = userRole ? String(userRole).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
  
  const isTresorier = roleClean === 'tresorier';
  const isSecretaire = roleClean === 'secretaire';
  const isAdmin = roleClean.includes('admin') || roleClean.includes('administrateur');
  const roleReconnu = isTresorier || isSecretaire || isAdmin;

  // États principaux
  const [montant, setMontant] = useState("")
  const [devise, setDevise] = useState("USD")
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]) // Date pour trésorier
  const [dureeMois, setDureeMois] = useState(12) // Pour secrétaire/admin
  
  const [selectedMembreId, setSelectedMembreId] = useState("")
  const [selectedMembreLabel, setSelectedMembreLabel] = useState("")
  
  // États pour la recherche de membre
  const [searchTerm, setSearchTerm] = useState("")
  const [membres, setMembres] = useState([])
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Charger la liste des membres
  const loadMembres = async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/membres', {
        params: { per_page: 100, order_by: 'nom', order: 'asc' }
      })
      
      if (response.data.success) {
        const data = response.data.data.data || response.data.data
        const formattedMembres = Array.isArray(data) ? data.map(m => ({
          id: m.id,
          label: `${m.nom} ${m.prenom || ''} - ${m.telephone || ''}`,
          nom: m.nom,
          telephone: m.telephone
        })) : []
        
        setMembres(formattedMembres)
        
        if (membrePreSelectionne) {
          const membreLabel = `${membrePreSelectionne.nom} ${membrePreSelectionne.prenom || ''} - ${membrePreSelectionne.telephone || ''}`
          setSelectedMembreId(String(membrePreSelectionne.id))
          setSelectedMembreLabel(membreLabel)
        }
      }
    } catch (error) {
      console.error("Erreur API membres:", error)
      setMembres([])
    } finally {
      setIsLoading(false)
    }
  }

  // Initialisation
  useEffect(() => {
    if (open) {
      setMontant("")
      setDevise("USD")
      setDatePaiement(new Date().toISOString().split('T')[0])
      setDureeMois(12)
      setSelectedMembreId("")
      setSelectedMembreLabel("")
      setSearchTerm("")
      loadMembres()
    }
  }, [open])

  // Sélection simple d'un membre
  const handleMembreSelect = (membreId, membreLabel) => {
    setSelectedMembreId(membreId)
    setSelectedMembreLabel(membreLabel)
    setSearchTerm("")
  }

  // Filtrer les membres basé sur la recherche
  const filteredMembres = searchTerm.trim() === "" 
    ? [] 
    : membres.filter(m => 
        m.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.telephone?.includes(searchTerm)
      ).slice(0, 5)

  const handleSubmit = async () => {
    if (!roleReconnu) {
      toast.error("Votre rôle ne permet pas d'enregistrer.")
      return
    }
    
    if (!selectedMembreId) {
      toast.error("Veuillez sélectionner un membre")
      return
    }
    
    if (!montant || parseFloat(montant) <= 0) {
      toast.error("Veuillez entrer un montant valide")
      return
    }

    setIsSubmitting(true)
    
    try {
      // ========== TRÉSORIER ==========
      if (isTresorier) {
        const dimeData = {
          membre_id: parseInt(selectedMembreId),
          devise: devise,
          mois: new Date(datePaiement).toLocaleDateString('fr-FR', { month: 'long' }),
          date_versement: datePaiement,
          methode_paiement: "Espèces",
          note: `Dîme payée le ${datePaiement}`,
          enregistre_par: 1
        };

        if(devise === "USD"){
          dimeData.montant_usd = parseFloat(montant);


        } else if(devise === "CDF"){
          dimeData.montant_cdf = parseFloat(montant)
        }
        
        const response = await api.post('/dimes', dimeData)
        
        if (response.data.success) {
          toast.success(`✅ Dîme de ${montant} ${devise} enregistrée`)
          
          // Redirection automatique après succès
          if (onSuccess) {
            onSuccess()
          }
          
          // Fermer la popup
          setTimeout(() => {
            onClose()
          }, 1500)
        }
      }
      
      // ========== SECRÉTAIRE OU ADMIN ==========
    // ========== SECRÉTAIRE OU ADMIN ==========
else if (isSecretaire || isAdmin) {
  // 1. Trouver l'objet membre pour récupérer son téléphone
  const membreInfo = membres.find(m => String(m.id) === String(selectedMembreId));
  const telephone = membreInfo?.telephone;

  if (!telephone) {
    toast.error("Impossible de vérifier l'engagement : numéro de téléphone manquant.");
    setIsSubmitting(false);
    return;
  }

  // 2. Vérification STRICTE de l'engagement en cours par téléphone
  try {
    // On utilise la route publique qui cherche par téléphone comme tu l'as souhaité
    const checkResponse = await api.get(`/promesses/pending-public/${telephone}`);
    
    // Si has_pending est vrai (ou hasPending selon ton JSON), on BLOQUE
    if (checkResponse.data.success && (checkResponse.data.has_pending || checkResponse.data.hasPending)) {
      const details = checkResponse.data.data;
      toast.error(
        <div>
          <p className="font-bold text-base">🚫 Création impossible</p>
          <p className="text-sm">Ce membre a déjà un engagement actif :</p>
          <p className="text-xs font-mono mt-1">
             Reste : {details.montant_restant} {details.devise} ({details.pourcentage_paye}% payé)
          </p>
        </div>,
        { autoClose: 5000 }
      );
      setIsSubmitting(false);
      return; // <--- ARRÊT CRITIQUE : On ne crée pas la promesse
    }
  } catch (checkError) {
    console.error("Erreur technique lors de la vérification", checkError);
    // Optionnel : tu peux décider de bloquer ici aussi par sécurité
  }

  // 3. Si on arrive ici, le membre est libre : on crée l'engagement
  const promesseData = {
    membre_id: parseInt(selectedMembreId),
    montant_total: parseFloat(montant),
    devise: devise,
    duree_mois: parseInt(dureeMois),
    date_debut: new Date().toISOString().split('T')[0],
    observation: "Construction",
    projet: "Construction"
  };

  try {
    // Utilise la route /promesses/public car c'est celle qui pointe vers storePublic dans ton api.php
    const response = await api.post('/promesses/public', promesseData);
    
    if (response.data.success) {
      toast.success(`✅ Engagement de ${montant} ${devise} créé avec succès`);
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1500);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || "Erreur lors de la création";
    toast.error(`❌ ${errorMsg}`);
  }
}
      
    } catch (error) {
      console.error("Erreur:", error)
      
      if (error.response?.status === 422) {
        const message = error.response.data.message || "Erreur de validation"
        
        if (message.includes("déjà un engagement actif")) {
          toast.error(
            <div>
              <p className="font-semibold">❌ Engagement existant</p>
              <p className="text-sm">{message}</p>
              <p className="text-sm mt-1">Le membre doit d'abord finaliser son engagement.</p>
            </div>,
            { autoClose: 6000 }
          )
        } else {
          toast.error(`❌ ${message}`)
        }
      } else if (error.response?.status === 403) {
        toast.error("❌ Accès refusé. Vérifiez vos permissions.")
      } else {
        toast.error("❌ Erreur serveur. Réessayez.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {isTresorier ? <DollarSign className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isTresorier ? "Nouvelle Dîme" : "Nouvel Engagement"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isTresorier ? "Trésorier • Table DIM" : "Secrétaire/Admin • Table PROMESSE"}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {!roleReconnu ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-800 font-bold">Accès refusé</p>
                <p className="text-red-700 text-xs mt-1">Le rôle "{userRole || 'vide'}" n'est pas autorisé.</p>
                <button onClick={onClose} className="mt-4 w-full py-2 bg-red-600 text-white rounded-lg text-sm">Fermer</button>
              </div>
            ) : (
              <>
                {/* 1. Recherche de Membre */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Chercher un membre</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nom ou téléphone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>

                  {/* Membre sélectionné */}
                  {selectedMembreId && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-blue-700 font-medium">Sélectionné</p>
                          <p className="font-semibold text-gray-900 text-sm truncate">{selectedMembreLabel}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedMembreId("")
                            setSelectedMembreLabel("")
                          }}
                          className="text-gray-400 hover:text-red-500 ml-2 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Liste des résultats */}
                  {searchTerm.trim() !== "" && filteredMembres.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {filteredMembres.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleMembreSelect(m.id, m.label)}
                          className="w-full text-left px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <p className="text-sm font-medium text-gray-800">{m.label}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchTerm.trim() !== "" && filteredMembres.length === 0 && !isLoading && (
                    <div className="mt-2 px-4 py-2.5 text-sm text-gray-500 italic bg-gray-50 rounded-lg">
                      Aucun membre trouvé
                    </div>
                  )}
                </div>

                {/* 2. Montant & Devise */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Montant</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Devise</label>
                    <select
                      value={devise}
                      onChange={(e) => setDevise(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="CDF">CDF (FC)</option>
                      
                    </select>
                  </div>
                </div>

                {/* 3. Champs spécifiques au rôle */}
                {isTresorier ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Date du paiement</label>
                    <input
                      type="date"
                      value={datePaiement}
                      onChange={(e) => setDatePaiement(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Durée (mois)</label>
                    <select
                      value={dureeMois}
                      onChange={(e) => setDureeMois(parseInt(e.target.value))}
                      className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      {[1, 3, 6, 12, 24].map((d) => (
                        <option key={d} value={d}>{d} mois</option>
                      ))}
                    </select>
                  </div>
                )}

             
                {/* 5. Boutons d'action */}
                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !montant || !selectedMembreId}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:shadow-lg"
                  >
                    {isSubmitting ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <DollarSign className="w-4 h-4" />
                    )}
                    {isTresorier ? 'Enregistrer la dîme' : 'Créer l\'engagement'}
                  </button>
                  {/* <button 
                    onClick={onClose} 
                    className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Annuler
                  </button> */}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}