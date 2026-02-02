import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../../../api/axios"

export default function EngagementFormPaye() {
  const [phone, setPhone] = useState("")
  const [engagement, setEngagement] = useState(null)
  const [membreNom, setMembreNom] = useState("")
  const [membreId, setMembreId] = useState(null) // IMPORTANT: Pour l'API
  const [selected, setSelected] = useState(null)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate() // Pour la redirection

  const fetchEngagements = async (value) => {
    if (value.length < 9) {
      setEngagement(null)
      setMembreNom("")
      setMembreId(null)
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await api.get(`/promesses/pending-public/${value}`)
      console.log("📊 Réponse API Engagement:", res.data) // DEBUG

      if (res.data.has_pending) {
        // Stocker l'engagement ET les infos du membre
        setEngagement(res.data.data)
        setMembreNom(res.data.membre_nom || "Membre inconnu")
        setMembreId(res.data.membre_id) // IMPORTANT: Récupérer l'ID du membre
        setSelected(res.data.data)
      } else {
        setEngagement(null)
        setMembreNom("")
        setMembreId(null)
        setSelected(null)
        setError(res.data.message || "Aucun engagement actif trouvé")
      }

    } catch (err) {
      console.error("Erreur recherche engagement:", err)
      setError("Erreur lors de la recherche de l'engagement")
      setEngagement(null)
      setMembreNom("")
      setMembreId(null)
      setSelected(null)
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value
    setPhone(value)
    setError("")
    
    if (value.length < 9) {
      setEngagement(null)
      setMembreNom("")
      setMembreId(null)
      setSelected(null)
      return
    }
    
    const timeoutId = setTimeout(() => {
      fetchEngagements(value)
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }

  // FONCTION DE REDIRECTION VERS TESTPAYMENT
  const goToPayment = () => {
    if (!selected) {
      setError("Veuillez d'abord rechercher un engagement")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Veuillez entrer un montant valide")
      return
    }

    const numericAmount = parseFloat(amount)
    
    // Vérifier que le montant ne dépasse pas le solde restant
    if (numericAmount > selected.montant_restant) {
      setError(`Le montant ne peut pas dépasser ${selected.montant_restant}$`)
      return
    }

    // Vérifier que nous avons l'ID du membre
    if (!membreId) {
      setError("ID du membre manquant. Veuillez réessayer la recherche.")
      return
    }

    // DEBUG: Vérifier les données
    console.log("🚀 Données pour TestPayment:", {
      membre: {
        id: membreId,
        nom: membreNom,
        telephone: phone,
      },
      engagement: selected,
      montant: numericAmount,
      type: "engagement"
    })

    // PRÉPARER LES DONNÉES POUR LA PAGE DE PAIEMENT
    const paymentData = {
      membre: {
        id: membreId, // ID du membre (OBLIGATOIRE pour l'API)
        nom: membreNom,
        telephone: phone,
      },
      engagement: selected, // Tout l'objet engagement
      montant: numericAmount,
      type: "engagement", // Important pour TestPayment
      description: `Paiement engagement #${selected.id}`
    }

    // REDIRECTION VERS TESTPAYMENT
    navigate("/test-payment", {
      state: paymentData
    })
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold text-center">
        Paiement Engagement
      </h1>

      {/* 📱 Téléphone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Numéro de téléphone
        </label>
        <input
          placeholder="Ex: 0812345678"
          value={phone}
          onChange={handlePhoneChange}
          className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          maxLength={12}
          disabled={loading}
        />
        <p className="text-xs text-gray-500 mt-1">
          Entrez au moins 9 chiffres pour rechercher vos engagements
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Recherche en cours...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* 📋 Engagement trouvé */}
      {engagement && !loading && (
        <div
          onClick={() => setSelected(engagement)}
          className={`border p-4 rounded cursor-pointer transition ${
            selected?.id === engagement.id 
              ? "bg-green-50 border-green-400 ring-2 ring-green-200" 
              : "hover:bg-gray-50"
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold">Engagement #{engagement.id}</h3>
            <span className={`px-2 py-1 text-xs rounded-full ${
              engagement.statut === 'actif' ? 'bg-green-100 text-green-800' :
              engagement.statut === 'termine' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {engagement.statut}
            </span>
          </div>
          
          <div className="space-y-2">
            <p><b>Membre :</b> {membreNom}</p>
            <p><b>ID Membre :</b> {membreId}</p>
            <p><b>Montant total :</b> {engagement.montant_total} {engagement.devise}</p>
            <p><b>Déjà payé :</b> {engagement.montant_paye} {engagement.devise}</p>
            
            <div className="mt-3">
              <div className="flex justify-between text-sm mb-1">
                <span>Progression</span>
                <span>{engagement.pourcentage_paye || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${engagement.pourcentage_paye || 0}%` }}
                ></div>
              </div>
            </div>
            
            <p className="text-green-700 font-semibold text-lg mt-2">
              Reste à payer : {engagement.montant_restant} {engagement.devise}
            </p>
          </div>
        </div>
      )}

      {/* 💰 Montant à payer */}
      {selected && (
        <div className="space-y-4 border-t pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant à payer ({selected.devise})
            </label>
            <input
              placeholder={`Maximum: ${selected.montant_restant}`}
              type="number"
              value={amount}
              onChange={e => {
                const value = e.target.value
                if (value === "" || parseFloat(value) >= 0) {
                  setAmount(value)
                  setError("")
                }
              }}
              min="0.01"
              max={selected.montant_restant}
              step="0.01"
              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {amount && parseFloat(amount) > selected.montant_restant && (
              <p className="text-red-600 text-sm mt-1">
                ❌ Le montant dépasse le solde restant
              </p>
            )}
            {amount && parseFloat(amount) <= selected.montant_restant && (
              <p className="text-green-600 text-sm mt-1">
                ✅ Solde restant après paiement: {(selected.montant_restant - parseFloat(amount)).toFixed(2)} {selected.devise}
              </p>
            )}
          </div>

          {/* BOUTON MODIFIÉ POUR REDIRIGER */}
          <button
            onClick={goToPayment} // Appelle la fonction de redirection
            disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > selected.montant_restant}
            className={`w-full py-3 rounded-lg font-medium transition ${
              loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > selected.montant_restant
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white flex items-center justify-center`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Traitement...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Payer {amount || "0.00"} {selected.devise}
              </>
            )}
          </button>

          <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
            <p className="font-medium">Prochaines étapes :</p>
            <p>1. Cliquez sur "Payer" pour aller à la page de paiement</p>
            <p>2. Vérifiez les détails de la transaction</p>
            <p>3. Enregistrez le paiement dans la base de données</p>
          </div>
        </div>
      )}

      {/* Aucun engagement trouvé */}
      {!engagement && !loading && phone.length >= 9 && !error && (
        <div className="text-center p-4 border rounded-lg bg-gray-50">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 font-medium">
            Aucun engagement actif trouvé
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ce numéro n'a pas d'engagement en cours ou tous sont déjà finalisés.
          </p>
        </div>
      )}
    </div>
  )
}