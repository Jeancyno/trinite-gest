import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../../../api/axios";

export default function CinetPayProcessor() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const paymentData = location.state;

  useEffect(() => {
    if (!paymentData) navigate("/");
  }, [paymentData, navigate]);

  const handlePayment = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Initialisation CinetPay
    window.CinetPay.setConfig({
      apikey: 'VOTRE_API_KEY', 
      site_id: 'VOTRE_SITE_ID',
      notify_url: 'https://votre-domaine.com/api/paiement/webhook',
      mode: 'PRODUCTION' 
    });

    window.CinetPay.getCheckout({
      transaction_id: Math.floor(Math.random() * 100000000).toString(),
      amount: paymentData.montant,
      currency: 'USD',
      channels: 'ALL',
      description: paymentData.description,
      customer_name: paymentData.membre.nom,
      customer_surname: paymentData.membre.prenom || "Membre",
      customer_phone_number: paymentData.membre.telephone,
    });

    window.CinetPay.waitResponse(async (data) => {
      if (data.status === 'ACCEPTED') {
        try {
          // 1. Enregistrement dans ta base Laravel
          const response = await api.post('/paiements/public', {
            type: paymentData.type,
            membre_id: paymentData.membre.id,
            promesse_id: paymentData.type === 'engagement' ? paymentData.engagement.id : null,
            montant: paymentData.montant,
            methode_paiement: 'mobile_money',
            date_paiement: new Date().toISOString().split('T')[0],
            statut: 'complete',
            observation: `CinetPay Ref: ${data.operator_id}`
          });

          // 2. Redirection vers TA page de confirmation avec toutes les infos
          if (response.data.success) {
            navigate("/confirmation-paiement", { 
              state: {
                type: paymentData.type,
                montant: paymentData.montant,
                devise: 'USD',
                membre: paymentData.membre,
                engagement: paymentData.engagement, // Sera null si c'est une dime
                paymentData: response.data.data, // Les infos retournées par Laravel (ID, etc.)
                datePaiement: new Date(),
                methode: 'CinetPay Mobile Money',
                observation: response.data.data.observation
              }
            });
          }
        } catch (err) {
          alert("Erreur lors de l'enregistrement final.");
          setIsProcessing(false);
        }
      } else {
        alert("Paiement annulé.");
        setIsProcessing(false);
      }
    });
  };

  if (!paymentData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-gray-100">
        <h2 className="text-xl font-bold text-center mb-6">Finalisation du paiement</h2>
        <div className="bg-blue-50 p-4 rounded-xl mb-6">
            <p className="text-sm text-blue-600 mb-1">Montant à payer</p>
            <p className="text-3xl font-black text-blue-800">{paymentData.montant} $</p>
        </div>
        <button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold transition-all"
        >
          {isProcessing ? "Lancement du guichet..." : "Ouvrir CinetPay"}
        </button>
      </div>
    </div>
  );
}