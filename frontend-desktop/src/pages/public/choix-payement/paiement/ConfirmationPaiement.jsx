import React, { useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export default function ConfirmationPaiement() {
  const location = useLocation()
  const navigate = useNavigate()
  const receiptRef = useRef() // Référence pour capturer le PDF

  const {
    type,
    montant,
    devise,
    membre,
    engagement,
    paymentData,
    datePaiement,
    methode,
    observation
  } = location.state || {}

  // Sécurité si aucune donnée n'est présente
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
          <button onClick={() => navigate("/")} className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium">
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  // --- LOGIQUE DU PDF ---
  const handleDownloadPDF = async () => {
    const element = receiptRef.current
    const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true })
    const data = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const imgProps = pdf.getImageProperties(data)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

    // On ajoute un peu de marge en haut (10mm)
    pdf.addImage(data, 'PNG', 0, 10, pdfWidth, pdfHeight)
    pdf.save(`Recu_${type}_${membre?.nom || 'Paiement'}.pdf`)
  }

  // Formater le montant
  const formatMontant = (m, d) => {
    const formatted = parseFloat(m || 0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    return d === 'USD' ? `${formatted} $` : `${formatted} FC`
  }

  const paiementInfo = paymentData || {}
  const devisePaiement = devise || paiementInfo.devise || 'USD'
  const montantPaiement = montant || paiementInfo.montant || 0

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      
      {/* 📄 ZONE CAPTURÉE POUR LE PDF */}
      <div 
        ref={receiptRef} 
        className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center border-t-8 border-blue-600"
      >
        <div className="mb-6">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest">Reçu Officiel</h2>
          <div className="h-px bg-gray-200 w-full my-2"></div>
          <p className="text-[10px] text-gray-400">Date: {new Date().toLocaleString()}</p>
        </div>

        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className="text-2xl font-bold mb-2">Paiement Réussi !</h1>
        <p className="text-gray-500 text-sm mb-6">Merci pour votre contribution.</p>

        <div className="bg-gray-50 rounded-lg p-5 mb-6 text-left border-dashed border-2 border-gray-200">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 uppercase font-semibold">Type</span>
              <span className="font-medium text-sm text-blue-800 bg-blue-50 px-2 py-0.5 rounded uppercase">{type}</span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-xs text-gray-500 uppercase font-semibold">Membre</span>
              <div className="text-right">
                <span className="font-bold text-sm block">{membre?.nom} {membre?.prenom}</span>
                <span className="text-[10px] text-gray-400">{membre?.telephone}</span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-b border-gray-200 py-3 my-2">
              <span className="text-xs text-gray-500 uppercase font-semibold">Total Payé</span>
              <span className="text-xl font-black text-blue-600">
                {formatMontant(montantPaiement, devisePaiement)}
              </span>
            </div>

            {type === "engagement" && engagement && (
              <div className="space-y-1 text-[11px] text-gray-600">
                <div className="flex justify-between italic">
                  <span>Solde restant avant :</span>
                  <span>{formatMontant(engagement.montant_restant, engagement.devise)}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800">
                  <span>Nouveau solde :</span>
                  <span>{formatMontant(engagement.montant_restant - montantPaiement, engagement.devise)}</span>
                </div>
              </div>
            )}

            <div className="pt-2 text-[10px] text-gray-400 flex justify-between">
              <span>Réf : #{paiementInfo.id || 'WEB-SYNC'}</span>
              <span className="capitalize">{methode || 'Mobile Money'}</span>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-gray-400 italic leading-tight">
          "Donnez, et il vous sera donné : on versera dans votre sein une bonne mesure..." <br/> Luc 6:38
        </p>
      </div>

      {/* 🛠 BOUTONS D'ACTIONS (Hors PDF) */}
      <div className="max-w-md w-full mt-6 space-y-3">
        <button
          onClick={handleDownloadPDF}
          className="w-full flex items-center justify-center bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-100"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
          </svg>
          Télécharger le Reçu PDF
        </button>

        <button
          onClick={() => navigate(type === "dime" ? "/public/dime" : "/public/engagement")}
          className="w-full bg-white text-blue-600 py-3 rounded-xl font-semibold border border-blue-100 hover:bg-blue-50 transition-colors"
        >
          Faire un autre paiement
        </button>
        
        <button onClick={() => navigate("/")} className="w-full text-gray-400 text-sm hover:underline py-2">
          Retour à l'accueil
        </button>
      </div>
    </div>
  )
}