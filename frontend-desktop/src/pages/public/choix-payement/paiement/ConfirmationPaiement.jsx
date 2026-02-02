import React from "react"
import { useLocation, useNavigate } from "react-router-dom"

export default function ConfirmationPaiement() {
  const location = useLocation()
  const navigate = useNavigate()
  
  const { 
    type, 
    montant, 
    devise, // IMPORTANT : Ajouter la devise
    membre, 
    engagement, 
    paymentData,
    datePaiement,
    methode,
    observation
  } = location.state || {}

  if (!paymentData && !montant) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-4">Aucune donnée</h1>
          <p className="text-gray-600 mb-6">Aucune information de paiement trouvée.</p>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  // Formater le montant avec la devise
  const formatMontant = (montant, devise) => {
    const montantFormate = parseFloat(montant || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return devise === 'USD' ? `${montantFormate} $` : `${montantFormate} FC`
  }

  // Récupérer les informations du paiement
  const paiementInfo = paymentData || {}
  
  // Déterminer la devise
  const devisePaiement = devise || paiementInfo.devise || 'USD'
  
  // Déterminer le montant
  const montantPaiement = montant || paiementInfo.montant || paiementInfo.montant_usd || paiementInfo.montant_cdf || 0

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
        
        {/* Icône de succès */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Paiement enregistré !</h1>
        <p className="text-gray-600 mb-6">Le paiement a été enregistré avec succès dans la base de données.</p>

        {/* Détails */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium px-3 py-1 rounded-full capitalize bg-blue-100 text-blue-800 text-sm">
                {type === "dime" ? "Dîme" : "Engagement"}
              </span>
            </div>
            
            {membre && (
              <div className="flex justify-between">
                <span className="text-gray-600">Membre:</span>
                <div className="text-right">
                  <span className="font-medium block">{membre.nom_complet || `${membre.nom} ${membre.prenom || ""}`.trim()}</span>
                  {membre.telephone && (
                    <span className="text-xs text-gray-500 block">{membre.telephone}</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Montant:</span>
              <span className={`font-bold text-lg ${
                devisePaiement === 'USD' ? 'text-blue-600' : 'text-green-600'
              }`}>
                {formatMontant(montantPaiement, devisePaiement)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Devise:</span>
              <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                devisePaiement === 'USD' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {devisePaiement === 'USD' ? 'Dollars (USD)' : 'Francs (CDF)'}
              </span>
            </div>
            
            {methode && (
              <div className="flex justify-between">
                <span className="text-gray-600">Méthode:</span>
                <span className="font-medium capitalize">{methode}</span>
              </div>
            )}
            
            {datePaiement && (
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(datePaiement).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
            
            {type === "engagement" && engagement && (
              <>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Engagement #:</span>
                    <span className="font-medium">{engagement.id}</span>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Ancien solde:</span>
                    <span className="font-medium">
                      {formatMontant(engagement.montant_restant, engagement.devise)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Montant payé:</span>
                    <span className="font-medium text-green-600">
                      {formatMontant(montantPaiement, devisePaiement)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between mt-2">
                    <span className="text-gray-600">Nouveau solde:</span>
                    <span className="font-bold">
                      {formatMontant(
                        engagement.montant_restant - montantPaiement, 
                        engagement.devise
                      )}
                    </span>
                  </div>
                </div>
              </>
            )}
            
            {observation && (
              <div className="border-t pt-3">
                <span className="text-gray-600 block mb-1">Observation:</span>
                <p className="text-sm text-gray-700 bg-white p-2 rounded border">{observation}</p>
              </div>
            )}
            
            {paiementInfo?.id && (
              <div className="flex justify-between border-t pt-3">
                <span className="text-gray-600">Référence:</span>
                <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  #{paiementInfo.id}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          <button
            onClick={() => navigate(type === "dime" ? "/public/dime" : "/public/engagement")}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Faire un autre paiement
          </button>
        
          
          {/* {paiementInfo?.id && (
            <button
              onClick={() => {
                // Fonction pour imprimer ou sauvegarder
                window.print()
              }}
              className="w-full border border-blue-300 text-blue-600 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Imprimer le reçu
            </button>
          )} */}
        </div>

        <p className="text-sm text-gray-500 mt-6">
          {type === "dime" 
            ? "La dîme a été enregistrée avec succès." 
            : "Le paiement d'engagement a été enregistré avec succès."}
          <br />
          <span className="text-xs">Un reçu électronique a été généré.</span>
        </p>
      </div>
    </div>
  )
}