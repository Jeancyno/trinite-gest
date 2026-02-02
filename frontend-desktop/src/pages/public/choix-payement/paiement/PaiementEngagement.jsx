import { useState } from "react"
import api from "../../../../api/axios"

export default function PaiementEngagement() {
  const [promesseId, setPromesseId] = useState("")
  const [membreId, setMembreId] = useState("")
  const [montant, setMontant] = useState("")

  const payer = async () => {
    try {
      await api.post("/paiements", {
        type: "engagement",
        membre_id: membreId,
        promesse_id: promesseId,
        montant: montant,
        methode_paiement: "mobile_money",
        date_paiement: new Date().toISOString().split("T")[0],
        statut: "complete"
      })

      alert("Paiement enregistré avec succès ✅")

    } catch (e) {
      alert("Erreur paiement")
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">

      <h1 className="text-xl font-bold">Paiement Engagement</h1>

      <input
        placeholder="ID membre"
        className="border p-2 w-full"
        value={membreId}
        onChange={e => setMembreId(e.target.value)}
      />

      <input
        placeholder="ID engagement"
        className="border p-2 w-full"
        value={promesseId}
        onChange={e => setPromesseId(e.target.value)}
      />

      <input
        placeholder="Montant"
        className="border p-2 w-full"
        value={montant}
        onChange={e => setMontant(e.target.value)}
      />

      <button
        onClick={payer}
        className="w-full bg-blue-600 text-white py-3 rounded"
      >
        Payer maintenant
      </button>

    </div>
  )
}
