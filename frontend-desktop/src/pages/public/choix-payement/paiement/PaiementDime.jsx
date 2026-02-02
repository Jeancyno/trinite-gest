import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../../../api/axios"

export default function DimeForm() {
  const [phone, setPhone] = useState("")
  const [member, setMember] = useState(null)
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const fetchMember = async () => {
    if (!phone || phone.length < 9) {
      setError("Veuillez entrer un numéro valide (au moins 9 chiffres)")
      return
    }

    setLoading(true)
    setError("")
    setMember(null)

    try {
      const res = await api.get(`/membres/search-by-phone/${phone}`)
      
      if (res.data.success && res.data.exists) {
        setMember(res.data.data)
      } else {
        setError(res.data.message || "Membre non trouvé")
      }
    } catch (err) {
      console.error("Erreur recherche membre:", err)
      setError("Erreur lors de la recherche du membre")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchMember()
    }
  }

  const goToPayment = () => {
    if (!member) {
      setError("Veuillez d'abord rechercher un membre")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Veuillez entrer un montant valide")
      return
    }

    // Préparer les données pour la page de paiement
    const paymentData = {
      membre: member,
      montant: parseFloat(amount),
      type: "dime",
      description: `Dîme - ${member.nom} ${member.prenom || ""}`
    }

    navigate("/test-payment", {
      state: paymentData
    })
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        Paiement de Dîme
      </h1>

      {/* Numéro de téléphone */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Numéro de téléphone du membre
        </label>
        <div className="flex space-x-2">
          <input
            type="tel"
            placeholder="Ex: 0812345678"
            value={phone}
            onChange={e => {
              setPhone(e.target.value)
              setError("")
            }}
            onBlur={fetchMember}
            onKeyPress={handleKeyPress}
            className="flex-1 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <button
            onClick={fetchMember}
            disabled={loading}
            className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? "..." : "Chercher"}
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Entrez au moins 9 chiffres
        </p>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2">Recherche en cours...</span>
        </div>
      )}

      {/* Message d'erreur */}
      {error && !loading && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Informations du membre */}
      {member && !loading && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-3">
          <h3 className="font-bold text-lg text-blue-800">Membre trouvé</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-gray-600">Nom complet</p>
              <p className="font-medium">
                {member.nom} {member.postnom || ""} {member.prenom || ""}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Téléphone</p>
              <p className="font-medium">{member.telephone}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Genre</p>
              <p className="font-medium">{member.sexe === 'M' ? 'Homme' : 'Femme'}</p>
            </div>
            
            {member.photo_url && (
              <div className="col-span-2">
                <p className="text-sm text-gray-600 mb-2">Photo</p>
                <img 
                  src={member.photo_url} 
                  alt={`${member.nom}`}
                  className="w-24 h-24 object-cover rounded-full border"
                />
              </div>
            )}
          </div>

          {/* Si vous voulez afficher des engagements existants */}
          {member.has_pending_engagements && member.pending_engagements && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm text-gray-600 mb-2">Engagements en cours :</p>
              <div className="space-y-2">
                {member.pending_engagements.map(engagement => (
                  <div key={engagement.id} className="text-xs bg-white p-2 rounded">
                    <p>Montant: {engagement.montant_total} {engagement.devise}</p>
                    <p>Payé: {engagement.pourcentage_paye}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Montant de la dîme */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Montant de la dîme ($)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            $
          </span>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => {
              const value = e.target.value
              if (value === "" || parseFloat(value) >= 0) {
                setAmount(value)
                setError("")
              }
            }}
            min="0"
            step="0.01"
            className="w-full border border-gray-300 p-3 pl-8 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={!member}
          />
        </div>
        
        {/* Suggestions de montants rapides */}
        <div className="flex space-x-2">
          {[5, 10, 20, 50].map(suggested => (
            <button
              key={suggested}
              type="button"
              onClick={() => setAmount(suggested.toString())}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              ${suggested}
            </button>
          ))}
        </div>
      </div>

      {/* Bouton de paiement */}
      <button
        onClick={goToPayment}
        disabled={!member || !amount || parseFloat(amount) <= 0}
        className={`w-full py-3 rounded-lg font-medium transition ${
          !member || !amount || parseFloat(amount) <= 0
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        } text-white`}
      >
        {member ? `Payer $${amount || 0} de dîme` : "Chercher d'abord un membre"}
      </button>

      {/* Information supplémentaire */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t">
        <p>La dîme est une offrande volontaire représentant 10% de vos revenus.</p>
        <p className="mt-1">"Apportez à la maison du trésor toutes les dîmes..." Malachie 3:10</p>
      </div>
    </div>
  )
}