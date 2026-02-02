import React, { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import api from "../../../../api/axios"

export default function TestPayment() {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Données passées depuis DimeForm ou EngagementFormPaye
  const { 
    membre, 
    montant, 
    type, // "dime" ou "engagement"
    description,
    engagement // Si c'est un paiement d'engagement
  } = location.state || {}
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("Mobile Money") // Changé pour correspondre à l'API
  const [note, setNote] = useState("") // Changé de "observation" à "note"
  const [datePaiement, setDatePaiement] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [mois, setMois] = useState(
    new Date().toLocaleString('fr-FR', { month: 'long', year: 'numeric' })
  )

  // Vérifier si les données sont complètes
  if (!membre || !montant || !type) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Données manquantes</h1>
          <p className="text-gray-600 mb-6">
            Les informations de paiement sont incomplètes. Veuillez retourner au formulaire précédent.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  // Enregistrer le paiement
  const enregistrerPaiement = async () => {
    if (!membre || !montant || montant <= 0) {
      setError("Données de paiement invalides")
      return
    }

    setLoading(true)
    setError("")

    try {
      let endpoint = ""
      let paymentData = {}

      if (type === "dime") {
        // Enregistrement d'une dîme - CORRIGÉ selon DimeController
        endpoint = "/dimes"
        paymentData = {
          membre_id: membre.id,
          montant: parseFloat(montant),
          devise: "USD",
          mois: mois, // Format: "Mars 2024"
          date_versement: datePaiement,
          methode_paiement: paymentMethod, // Doit être dans la liste: ["Espèces", "Mobile Money", "Banque", "Virement", "Carte de crédit", "Chèque", "Autre"]
          note: note || `Dîme de ${membre.nom} ${membre.prenom || ""}`,
          enregistre_par: 1 // ID admin par défaut - requis par l'API
        }

        // DEBUG: Afficher les données envoyées
        console.log("📤 Données Dîme envoyées:", paymentData)

      } else if (type === "engagement") {
        // Enregistrement d'un paiement d'engagement - CORRIGÉ selon PaiementController
        endpoint = "/paiements"
        paymentData = {
          type: "engagement",
          membre_id: membre.id,
          promesse_id: engagement?.id,
          montant: parseFloat(montant),
          methode_paiement: paymentMethod.toLowerCase().replace(" ", "_"), // Convertir pour PaiementController
          date_paiement: datePaiement,
          statut: "complete", // Ou "en_attente" selon votre besoin
          observation: note || `Paiement engagement #${engagement?.id || ""}`
        }

        // Vérification pour les engagements
        if (!engagement?.id) {
          setError("ID d'engagement manquant")
          setLoading(false)
          return
        }

        // DEBUG: Afficher les données envoyées
        console.log("📤 Données Engagement envoyées:", paymentData)
      }

      console.log("📤 Envoi à l'endpoint:", endpoint)

      // Appel API pour enregistrer
      const response = await api.post(endpoint, paymentData)
      console.log("📥 Réponse API:", response.data)

      if (response.data.success) {
        // Rediriger vers la confirmation
        navigate("/confirmation-paiement", {
          state: {
            type: type,
            montant: montant,
            membre: membre,
            engagement: engagement,
            paymentData: response.data.data,
            datePaiement: datePaiement,
            methode: paymentMethod
          }
        })
      } else {
        // Afficher les erreurs de validation détaillées
        const errorMsg = response.data.errors 
          ? Object.entries(response.data.errors)
              .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
              .join('; ')
          : response.data.message || "Erreur lors de l'enregistrement"
        
        setError(`Validation échouée: ${errorMsg}`)
      }
    } catch (err) {
      console.error("❌ Erreur détaillée:", err.response?.data || err.message)
      
      // Afficher les erreurs de validation
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors
        const errorMessages = Object.entries(validationErrors || {})
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ')
        
        setError(`Erreurs de validation: ${errorMessages}`)
      } else {
        setError(err.response?.data?.message || "Erreur de connexion au serveur")
      }
    } finally {
      setLoading(false)
    }
  }

  // Calculer le nouveau solde pour les engagements
  const calculerNouveauSolde = () => {
    if (type === "engagement" && engagement) {
      const montantRestant = engagement.montant_restant || 0
      const nouveauSolde = montantRestant - montant
      return {
        ancienSolde: montantRestant,
        nouveauSolde: nouveauSolde,
        complet: nouveauSolde <= 0
      }
    }
    return null
  }

  const nouveauSoldeInfo = calculerNouveauSolde()

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          Finaliser le paiement
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            <p className="font-bold mb-1">Erreur d'enregistrement:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Résumé de la transaction */}
        <div className="space-y-4 mb-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-lg mb-2">Détails de la transaction</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">
                  {type === "dime" ? "Dîme" : "Engagement"}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Membre:</span>
                <span className="font-medium text-right">
                  {membre.nom} {membre.prenom || ""}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">ID Membre:</span>
                <span className="font-mono text-sm">{membre.id}</span>
              </div>
              
              {/* Pour les engagements */}
              {type === "engagement" && engagement && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Engagement #:</span>
                    <span className="font-medium">{engagement.id}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Montant total:</span>
                    <span className="font-medium">${engagement.montant_total}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Déjà payé:</span>
                    <span className="font-medium">${engagement.montant_paye}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Solde restant:</span>
                    <span className="font-medium">${engagement.montant_restant}</span>
                  </div>
                  
                  {nouveauSoldeInfo && (
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600 font-bold">Nouveau solde:</span>
                      <span className={`font-bold ${
                        nouveauSoldeInfo.nouveauSolde <= 0 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        ${nouveauSoldeInfo.nouveauSolde.toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
              
              <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                <span>Montant à payer:</span>
                <span className="text-green-600">${montant}</span>
              </div>
            </div>
          </div>

          {/* Mois (pour dîme seulement) */}
          {type === "dime" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Mois de la dîme *
              </label>
              <input
                type="text"
                value={mois}
                onChange={(e) => setMois(e.target.value)}
                placeholder="Ex: Mars 2024"
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500">Format: Mois Année</p>
            </div>
          )}

          {/* Date de paiement */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Date de paiement *
            </label>
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Méthode de paiement *
            </label>
            {type === "dime" ? (
              // Pour dîmes - selon DimeController
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Espèces">Espèces</option>
                <option value="Mobile Money">Mobile Money</option>
                <option value="Banque">Banque</option>
                <option value="Virement">Virement</option>
                <option value="Carte de crédit">Carte de crédit</option>
                <option value="Chèque">Chèque</option>
                <option value="Autre">Autre</option>
              </select>
            ) : (
              // Pour engagements - selon PaiementController
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="cash">Espèces</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="carte">Carte bancaire</option>
                <option value="virement">Virement bancaire</option>
              </select>
            )}
          </div>

          {/* Note/Observation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {type === "dime" ? "Note" : "Observation"} (optionnel)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={type === "dime" ? "Ajouter une note..." : "Ajouter une observation..."}
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 h-20"
            />
          </div>

          {/* Information de test */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V7z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-yellow-700 font-bold mb-1">Mode TEST activé</p>
                <p className="text-sm text-yellow-700">
                  Ce paiement sera directement enregistré dans la base de données.
                  {type === "dime" && " L'ID utilisateur (enregistre_par) est requis."}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={enregistrerPaiement}
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition ${
              loading
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700"
            } text-white flex items-center justify-center`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enregistrement en cours...
              </>
            ) : (
              `Enregistrer le paiement de $${montant}`
            )}
          </button>

          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
            disabled={loading}
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  )
}