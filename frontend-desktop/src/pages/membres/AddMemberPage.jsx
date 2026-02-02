import { 
  User, 
  Phone, 
  MapPin, 
  Save, 
  ArrowLeft,
  UserPlus,
  Camera,
  AlertCircle,
  CheckCircle,
  X,
  Shield
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import api from "../../api/axios"
import "react-toastify/dist/ReactToastify.css"

// Composants d'icônes personnalisés
const MaleIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 20v-6"/>
    <path d="M14 20v-6"/>
    <circle cx="12" cy="8" r="4"/>
  </svg>
)

const FemaleIcon = ({ size = 16, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 15v7"/>
    <path d="M9 19h6"/>
    <circle cx="12" cy="9" r="4"/>
  </svg>
)

export default function AddMemberPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [formData, setFormData] = useState({
    nom: "",
    postnom: "",
    prenom: "",
    sexe: "",
    telephone: "",
    adresse: ""
  })

  const [errors, setErrors] = useState({})

  // Fonction de formatage du téléphone
  const formatPhoneForAPI = (phone) => {
    if (!phone) return phone;
    
    const cleaned = phone.replace(/\D/g, '')
    
    // Conversion vers format +243 standard
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      // 0XX XXX XXXX → +243 XX XXX XXXX
      return `+243 ${cleaned.slice(1, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
    }
    
    if (cleaned.length === 9 && !cleaned.startsWith('0') && !cleaned.startsWith('243')) {
      // XXX XXX XXX → +243 XX XXX XXXX
      return `+243 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('243')) {
      // 243XXXXXXXXX → +243 XX XXX XXXX
      return `+243 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`
    }
    
    // Si déjà formaté +243, retourner tel quel
    if (phone.includes('+243') && phone.length >= 16) {
      return phone
    }
    
    return phone
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }))
    }
  }

  const handlePhoneChange = (e) => {
    let value = e.target.value
    
    const cleaned = value.replace(/\D/g, '')
    let formatted = value
    
    if (cleaned.startsWith('243') && cleaned.length <= 12) {
      if (cleaned.length > 3) {
        formatted = '+243 ' + cleaned.slice(3)
        if (cleaned.length > 5) formatted = formatted.slice(0, 8) + ' ' + formatted.slice(8)
        if (cleaned.length > 8) formatted = formatted.slice(0, 12) + ' ' + formatted.slice(12)
      }
    } else if (cleaned.startsWith('0') && cleaned.length <= 10) {
      if (cleaned.length > 1) {
        formatted = '0' + cleaned.slice(1)
        if (cleaned.length > 3) formatted = formatted.slice(0, 3) + ' ' + formatted.slice(3)
        if (cleaned.length > 6) formatted = formatted.slice(0, 7) + ' ' + formatted.slice(7)
      }
    } else if (!cleaned.startsWith('0') && !cleaned.startsWith('243') && cleaned.length <= 9) {
      formatted = cleaned
      if (cleaned.length > 2) formatted = formatted.slice(0, 2) + ' ' + formatted.slice(2)
      if (cleaned.length > 5) formatted = formatted.slice(0, 6) + ' ' + formatted.slice(6)
    }
    
    handleInputChange('telephone', formatted)
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La photo ne doit pas dépasser 2MB")
        return
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Veuillez sélectionner une image")
        return
      }
      
      setPhoto(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est obligatoire"
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = "Le téléphone est obligatoire"
    } else {
      const cleaned = formData.telephone.replace(/\D/g, '')
      if (cleaned.length < 9) {
        newErrors.telephone = "Numéro de téléphone invalide (minimum 9 chiffres)"
      }
    }

    if (!formData.sexe) {
      newErrors.sexe = "Le sexe est obligatoire"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire")
      return
    }

    setIsLoading(true)

    try {
      const formattedPhone = formatPhoneForAPI(formData.telephone)
      
      console.log('📞 Téléphone formaté:', {
        original: formData.telephone,
        formatted: formattedPhone
      })

      // Préparer les données pour l'API - SANS email
      const memberData = {
        nom: formData.nom.trim(),
        postnom: formData.postnom.trim() || null,
        prenom: formData.prenom.trim() || null,
        sexe: formData.sexe,
        telephone: formattedPhone,
        adresse: formData.adresse.trim() || null,
      }

      console.log('📦 Données à envoyer:', memberData)

      // Utiliser la route publique (sans authentification requise)
      const endpoint = "/membres/public"
      
      console.log('📤 Envoi vers:', endpoint)
      
      const response = await api.post(endpoint, memberData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      console.log('✅ Réponse API:', response.data)
      
      toast.success(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle className="text-emerald-600" size={20} />
          </div>
          <div>
            <div className="font-semibold">Membre enregistré avec succès !</div>
            <div className="text-sm">Le membre a été ajouté à la base de données</div>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
        }
      )
      
      // Réinitialiser le formulaire
      setFormData({
        nom: "",
        postnom: "",
        prenom: "",
        sexe: "",
        telephone: "",
        adresse: ""
      })
      setPhoto(null)
      setPhotoPreview(null)
      setErrors({})

      // Rediriger vers la liste des membres
      setTimeout(() => {
        navigate("/membres")
      }, 1500)

    } catch (error) {
      console.error("❌ Erreur API:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      })
      
      let errorMessage = "Une erreur est survenue lors de l'enregistrement"
      let errorDetails = ""
      
      if (error.response?.status === 422) {
        // Erreur de validation Laravel
        const errors = error.response.data.errors
        if (errors) {
          errorMessage = "Veuillez corriger les erreurs suivantes:"
          Object.keys(errors).forEach(key => {
            errors[key].forEach(msg => {
              errorDetails += `• ${msg}\n`
            })
          })
        }
      } else if (error.response?.status === 409) {
        errorMessage = "Ce numéro de téléphone est déjà utilisé par un autre membre."
      } else if (error.response?.status === 401) {
        errorMessage = "Session expirée. Veuillez vous reconnecter."
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = "Le serveur met trop de temps à répondre."
        errorDetails = "Vérifiez que le serveur Laravel est démarré (php artisan serve)"
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = "Erreur réseau."
        errorDetails = "Vérifiez votre connexion internet et que le serveur est accessible."
      }
      
      toast.error(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <div>
            <div className="font-semibold">{errorMessage}</div>
            {errorDetails && (
              <div className="text-sm whitespace-pre-line">{errorDetails}</div>
            )}
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 8000,
        }
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-4 py-8 animate-fadeIn">
      {/* Header avec gradient */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm"
            >
              <ArrowLeft size={20} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
                Nouveau Membre
              </h1>
              <p className="text-gray-500 mt-1">
                Enregistrez un nouveau membre dans la base de données
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Shield size={14} />
            <span>Données sécurisées</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Header du formulaire */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-b border-purple-100 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-md">
                <UserPlus className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Informations du membre</h2>
                <p className="text-gray-600">
                  Remplissez les informations essentielles. Les champs avec <span className="text-red-500">*</span> sont obligatoires.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne gauche - Photo et sexe */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Photo de profil */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Camera className="text-blue-600" size={20} />
                      Photo de profil
                    </h3>
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-40 h-40 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                          {photoPreview ? (
                            <img 
                              src={photoPreview} 
                              alt="Preview" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="text-gray-400" size={48} />
                            </div>
                          )}
                        </div>
                        
                        {photoPreview ? (
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors shadow-lg"
                            title="Supprimer la photo"
                          >
                            <X className="text-white" size={14} />
                          </button>
                        ) : (
                          <label className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg">
                            <Camera className="text-white" size={18} />
                            <input
                              type="file"
                              onChange={handlePhotoChange}
                              accept="image/*"
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-4 text-center">
                        Photo optionnelle<br />
                        Formats: JPG, PNG, GIF • Max: 2MB
                      </p>
                    </div>
                  </div>

                  {/* Sexe */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <User className="text-blue-600" size={20} />
                      Sexe <span className="text-red-500">*</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleInputChange('sexe', 'M')}
                        className={`py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                          formData.sexe === "M"
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-300 shadow-sm"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <MaleIcon size={18} />
                        <span className="font-medium">Homme</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('sexe', 'F')}
                        className={`py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                          formData.sexe === "F"
                            ? "bg-gradient-to-r from-pink-50 to-rose-100 text-pink-700 border-pink-300 shadow-sm"
                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                        }`}
                      >
                        <FemaleIcon size={18} />
                        <span className="font-medium">Femme</span>
                      </button>
                    </div>
                    {errors.sexe && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle size={14} />
                        {errors.sexe}
                      </p>
                    )}
                  </div>

                  {/* Note d'information */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="text-blue-600" size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Informations importantes
                        </p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• Le téléphone est l'identifiant unique</li>
                          <li>• Vérifiez les informations avant validation</li>
                          <li>• Les données sont cryptées et sécurisées</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colonne droite - Formulaire */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nom (obligatoire) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nom <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.nom}
                          onChange={(e) => handleInputChange('nom', e.target.value)}
                          className={`w-full px-4 py-3.5 bg-gray-50/70 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all ${
                            errors.nom ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                          }`}
                          placeholder="Nom de famille"
                          disabled={isLoading}
                        />
                        {errors.nom && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <AlertCircle className="text-red-500" size={18} />
                          </div>
                        )}
                      </div>
                      {errors.nom && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.nom}
                        </p>
                      )}
                    </div>

                    {/* Postnom (optionnel) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Postnom
                      </label>
                      <input
                        type="text"
                        value={formData.postnom}
                        onChange={(e) => handleInputChange('postnom', e.target.value)}
                        className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                        placeholder="Postnom (optionnel)"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Prénom (optionnel) */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={formData.prenom}
                        onChange={(e) => handleInputChange('prenom', e.target.value)}
                        className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all"
                        placeholder="Prénom (optionnel)"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Téléphone (obligatoire) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Téléphone <span className="text-red-500">*</span>
                        <span className="text-xs text-gray-500 ml-2">(Identifiant unique)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.telephone}
                          onChange={handlePhoneChange}
                          className={`w-full px-4 py-3.5 bg-gray-50/70 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all ${
                            errors.telephone ? 'border-red-300 bg-red-50/50' : 'border-gray-200'
                          }`}
                          placeholder="le format exigé: 081 234 5678"
                          disabled={isLoading}
                        />
                        <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                      </div>
                      {errors.telephone ? (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle size={14} />
                          {errors.telephone}
                        </p>
                      ) : (
                        <div className="text-xs text-gray-500 space-y-1 mt-2">
                        
                        </div>
                      )}
                    </div>

                    {/* Adresse (optionnelle) */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Adresse complète
                      </label>
                      <div className="relative">
                        <textarea
                          value={formData.adresse}
                          onChange={(e) => handleInputChange('adresse', e.target.value)}
                          className="w-full px-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-all min-h-[120px]"
                          placeholder="N°, Rue, Quartier, Commune, Ville"
                          disabled={isLoading}
                          rows="4"
                        />
                        <MapPin className="absolute right-3 top-4 text-gray-400" size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-8 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-gray-100/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <CheckCircle size={14} className="text-emerald-500" />
                  <span>Tous les champs obligatoires sont marqués d'un astérisque (*)</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate(-1)}
                    disabled={isLoading}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowLeft size={18} />
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} className="group-hover:scale-110 transition-transform" />
                        <span>Enregistrer le membre</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Note de bas de page */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl">
            <Shield size={14} className="text-gray-400" />
            <span className="text-sm text-gray-500">
              Vos données sont sécurisées et confidentielles
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}