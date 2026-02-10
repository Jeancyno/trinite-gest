import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../../api/axios";

export default function TestPayment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Récupération des données passées par les formulaires
  const paymentData = location.state;

  useEffect(() => {
    // Si on arrive sur cette page sans données, on redirige vers l'accueil
    if (!paymentData) {
      navigate("*");
    }
  }, [paymentData, navigate]);

  const handleCinetPay = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // 1. Initialisation de la configuration CinetPay
    window.CinetPay.setConfig({
      apikey: 'VOTRE_API_KEY', // Remplacez par votre clé
      site_id: 'VOTRE_SITE_ID', // Remplacez par votre ID
      notify_url: 'https://votre-domaine.com/api/paiement/webhook',
      mode: 'PRODUCTION' // Changez en 'TEST' pour vos essais
    });

    // 2. Lancement du paiement
    window.CinetPay.getCheckout({
      transaction_id: Math.floor(Math.random() * 100000000).toString(),
      amount: paymentData.montant,
      currency: 'USD', // Important : Tes formulaires utilisent le symbole $
      channels: 'ALL',
      description: paymentData.description,
      customer_name: paymentData.membre.nom,
      customer_surname: paymentData.membre.prenom || "Membre",
      customer_phone_number: paymentData.membre.telephone,
      customer_email: "eglise@exemple.com", // Optionnel
    });

    // 3. Gestion de la réponse
    window.CinetPay.waitResponse(async (data) => {
      if (data.status === 'ACCEPTED') {
        try {
          // APPEL À TON CONTROLLER LARAVEL (Méthode enregistrerPublic)
          const response = await api.post('/paiements/public', {
            type: paymentData.type, // 'dime' ou 'engagement'
            membre_id: paymentData.membre.id,
            promesse_id: paymentData.type === 'engagement' ? paymentData.engagement.id : null,
            montant: paymentData.montant,
            methode_paiement: 'mobile_money',
            date_paiement: new Date().toISOString().split('T')[0],
            statut: 'complete',
            observation: `Paiement CinetPay Ref: ${data.operator_id}`
          });

          if (response.data.success) {
            alert("Paiement réussi et enregistré !");
            navigate("/success-page"); // Créez une page de succès
          }
        } catch (err) {
          console.error("Erreur enregistrement Laravel:", err);
          alert("Paiement réussi chez CinetPay, mais erreur d'enregistrement. Contactez l'admin.");
        }
      } else {
        alert("Le paiement a échoué ou a été annulé.");
      }
      setIsProcessing(false);
    });
  };

  if (!paymentData) return null;

  return (
    <div className="max-w-md mx-auto p-8 mt-10 bg-white shadow-xl rounded-2xl border border-gray-100">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6 text-center">Récapitulatif avant paiement</h2>
      
      <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-xl">
        <div className="flex justify-between">
          <span className="text-gray-500">Membre</span>
          <span className="font-bold text-gray-800">{paymentData.membre.nom}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Motif</span>
          <span className="font-bold text-blue-600 uppercase">{paymentData.type}</span>
        </div>
        <div className="border-t pt-4 flex justify-between items-center">
          <span className="text-lg font-medium text-gray-700">Total à payer</span>
          <span className="text-3xl font-black text-green-600">{paymentData.montant} $</span>
        </div>
      </div>

      <button
        onClick={handleCinetPay}
        disabled={isProcessing}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-orange-200 flex items-center justify-center"
      >
        {isProcessing ? "Traitement..." : "Confirmer le paiement via CinetPay"}
      </button>
      
      <button 
        onClick={() => navigate(-1)}
        className="w-full mt-4 text-gray-400 text-sm hover:underline"
      >
        Annuler et retourner
      </button>
    </div>
  );
}