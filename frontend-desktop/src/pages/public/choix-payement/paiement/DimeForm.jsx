import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../../../api/axios"

export default function DimeForm() {
  const [phone, setPhone] = useState("")
  const [member, setMember] = useState(null)
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  
  // Référence pour le debounce
  const searchTimeoutRef = useRef(null)

  // Recherche automatique après saisie (avec debounce)
  useEffect(() => {
    const trimmedPhone = phone.trim()
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    if (trimmedPhone.length >= 9) {
      setLoading(true)
      setError("")
      
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.get(`/membres/search-by-phone/${trimmedPhone}`)
          
          if (res.data.success && res.data.exists) {
            // Récupérer les informations COMPLÈTES du membre
            const membreInfo = res.data.data || {}
            
            // Construire le nom complet
            let nomComplet = ""
            if (membreInfo.nom || membreInfo.prenom) {
              nomComplet = `${membreInfo.prenom || ''} ${membreInfo.nom || ''} ${membreInfo.postnom || ''}`.trim()
            } else if (res.data.membre_nom) {
              nomComplet = res.data.membre_nom
            } else {
              nomComplet = "Membre"
            }
            
            setMember({
              id: res.data.membre_id || membreInfo.id,
              nom_complet: nomComplet,
              nom: membreInfo.nom || "",
              prenom: membreInfo.prenom || "",
              postnom: membreInfo.postnom || "",
              telephone: membreInfo.telephone || trimmedPhone,
              photo_url: membreInfo.photo_url || null
            })
          } else {
            setError("Membre non trouvé")
            setMember(null)
          }
        } catch (err) {
          console.error("Erreur recherche membre:", err)
          setError("Erreur lors de la recherche")
          setMember(null)
        } finally {
          setLoading(false)
        }
      }, 500) // 500ms de délai après la saisie
    } else if (trimmedPhone.length > 0 && trimmedPhone.length < 9) {
      setError("Numéro trop court (9 chiffres minimum)")
      setMember(null)
    } else if (trimmedPhone.length === 0) {
      setMember(null)
      setError("")
    }
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [phone])

  const goToPayment = () => {
    setError("")
    
    if (!member) {
      setError("Veuillez d'abord rechercher un membre")
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError("Veuillez entrer un montant valide")
      return
    }

    const numericAmount = parseFloat(amount)
    
    if (numericAmount < 1) {
      setError("Le montant minimum est de 1")
      return
    }

    // Préparer les données pour la page de paiement
    const paymentData = {
      type: "dime",
      montant: numericAmount,
      devise: currency,
      membre: {
        id: member.id,
        nom_complet: member.nom_complet,
        nom: member.nom,
        prenom: member.prenom,
        telephone: member.telephone,
        photo_url: member.photo_url
      },
      description: `Dîme - ${member.nom_complet} (${currency})`
    }

    console.log("📤 Données pour paiement:", paymentData)

    // Redirection vers la page de paiement
    navigate("/test-payment", {
      state: paymentData
    })
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value
    // N'autoriser que les chiffres
    const numbersOnly = value.replace(/\D/g, '')
    setPhone(numbersOnly)
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        Paiement de Dîme
      </h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Numéro de téléphone du membre
        </label>
        <input
          type="tel"
          placeholder="Ex: 0812345678"
          value={phone}
          onChange={handlePhoneChange}
          className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          maxLength={12}
        />
        <p className="text-xs text-gray-500">
          Entrez au moins 9 chiffres pour rechercher automatiquement
        </p>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-2">Recherche du membre...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
          {error}
        </div>
      )}

      {member && !loading && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-3">
              {member.photo_url ? (
                <img 
                  src={member.photo_url} 
                  alt={member.nom_complet}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm">
                  {member.nom_complet.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-xs text-green-700 font-medium">Membre trouvé ✓</p>
                <h3 className="font-bold text-gray-900 text-lg">{member.nom_complet}</h3>
                <div className="text-sm text-gray-600 space-y-1 mt-1">
                  <p className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {member.telephone}
                  </p>
                  <p className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    ID: {member.id}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setMember(null)
                setPhone("")
                setAmount("")
              }}
              className="text-gray-400 hover:text-red-500 text-lg p-1"
              title="Changer de membre"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {member && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Montant
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => {
                  const value = e.target.value
                  if (value === "" || parseFloat(value) >= 0) {
                    setAmount(value)
                  }
                }}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                step="0.01"
                min="1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Devise
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="CDF">CDF (FC)</option>
              </select>
            </div>
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <p className="text-blue-700 text-center font-medium">
                Montant à payer : {parseFloat(amount).toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} {currency}
              </p>
            </div>
          )}

          <button
            onClick={goToPayment}
            disabled={!amount || parseFloat(amount) <= 0 || !member}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Payer la dîme
          </button>

          <div className="text-xs text-gray-500 text-center p-2 bg-gray-50 rounded">
            <p className="font-medium mb-1">Prochaines étapes :</p>
            <p>1. Cliquez sur "Payer la dîme"</p>
            <p>2. Choisissez votre méthode de paiement</p>
            <p>3. Confirmez la transaction</p>
          </div>
        </>
      )}

      {!member && !loading && phone.length >= 9 && (
        <div className="text-center p-4 border border-gray-200 rounded-lg bg-gray-50">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 font-medium">
            Aucun membre trouvé
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Ce numéro n'est pas associé à un membre enregistré.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Vérifiez le numéro ou créez un nouveau membre.
          </p>
        </div>
      )}
    </div>
  )
}