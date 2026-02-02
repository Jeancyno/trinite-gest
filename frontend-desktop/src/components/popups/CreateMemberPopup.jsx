// CreateMemberPopup.jsx - Version corrigée avec tous les imports
import { useState, useRef } from "react"
import { 
  User, 
  Phone, 
  Home, 
  Save,
  ArrowLeft,
  X,
  Camera,
  UserPlus, // <-- AJOUTÉ ICI
  Smartphone,
  UserCheck
} from "lucide-react"
import api from "../../api/axios"
import { toast } from "react-toastify"

// Composants d'icônes personnalisés pour les genres
const MaleIcon = ({ size = 16, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10 20v-6"/>
    <path d="M14 20v-6"/>
    <circle cx="12" cy="8" r="4"/>
  </svg>
)

const FemaleIcon = ({ size = 16, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 15v7"/>
    <path d="M9 19h6"/>
    <circle cx="12" cy="9" r="4"/>
  </svg>
)

function CreateMemberPopup({ isOpen, onClose, onMemberCreated, defaultName, defaultPhone }) {
  const [formData, setFormData] = useState({
    nom: defaultName || "",
    postnom: "",
    prenom: "",
    sexe: "M",
    telephone: defaultPhone || "",
    adresse: "",
  })
  
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhoneChange = (e) => {
    let value = e.target.value
    
    // Supprimer tout ce qui n'est pas un chiffre
    let cleaned = value.replace(/\D/g, '')
    
    // Formater selon la longueur
    if (cleaned.startsWith('243')) {
      // Format: +243 81 234 5678
      if (cleaned.length > 3) {
        cleaned = '+243 ' + cleaned.slice(3)
        if (cleaned.length > 8) cleaned = cleaned.slice(0, 8) + ' ' + cleaned.slice(8)
        if (cleaned.length > 12) cleaned = cleaned.slice(0, 12) + ' ' + cleaned.slice(12)
      }
    } else if (cleaned.startsWith('0')) {
      // Format: 081 234 5678
      if (cleaned.length > 1) {
        cleaned = cleaned.slice(1)
        cleaned = '0' + (cleaned.length > 2 ? cleaned.slice(0, 2) + ' ' + cleaned.slice(2) : cleaned)
        if (cleaned.length > 7) cleaned = cleaned.slice(0, 7) + ' ' + cleaned.slice(7)
      }
    }
    
    setFormData(prev => ({ ...prev, telephone: cleaned }))
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Vérifier la taille (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("La photo ne doit pas dépasser 2MB")
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.nom.trim()) {
      toast.error("Le nom est obligatoire")
      return
    }
    
    if (!formData.telephone) {
      toast.error("Le numéro de téléphone est obligatoire")
      return
    }
    
    // Nettoyer le téléphone pour la validation
    const cleanedPhone = formData.telephone.replace(/\D/g, '')
    if (cleanedPhone.length < 9) {
      toast.error("Numéro de téléphone invalide (min. 9 chiffres)")
      return
    }

    setIsSubmitting(true)

    try {
      // Utiliser l'API publique pour créer le membre
      const memberData = {
        nom: formData.nom.trim(),
        postnom: formData.postnom.trim() || null,
        prenom: formData.prenom.trim() || null,
        sexe: formData.sexe,
        telephone: formData.telephone,
        adresse: formData.adresse.trim() || null,
      }

      let response
      
      // Si photo, utiliser FormData
      if (photo) {
        const formDataToSend = new FormData()
        Object.keys(memberData).forEach(key => {
          if (memberData[key] !== null && memberData[key] !== undefined) {
            formDataToSend.append(key, memberData[key])
          }
        })
        formDataToSend.append('photo', photo)
        
        // IMPORTANT: Utiliser la route publique
        response = await api.post("/membres/public", formDataToSend, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Accept': 'application/json'
          }
        })
      } else {
        // Sans photo, envoyer en JSON via la route publique
        response = await api.post("/membres/public", memberData)
      }

      // Appeler le callback avec le membre créé
      onMemberCreated(response.data.data)
      
      // Message de succès
      toast.success(
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <UserCheck className="text-emerald-600" size={20} />
          </div>
          <div>
            <div className="font-semibold">Membre créé avec succès !</div>
            <div className="text-sm">Vous pouvez maintenant finaliser votre engagement</div>
          </div>
        </div>
      )
      
      // Fermer le popup
      onClose()
      
    } catch (err) {
      console.error("Erreur création membre:", err)
      
      // Messages d'erreur spécifiques
      if (err.response?.status === 422) {
        // Erreur de validation Laravel
        const errors = err.response.data.errors
        const firstError = Object.values(errors)[0]?.[0]
        toast.error(firstError || "Données invalides")
      } else if (err.response?.status === 409) {
        // Conflit - téléphone déjà utilisé
        toast.error("Ce numéro de téléphone est déjà utilisé")
      } else if (err.response?.status === 404) {
        toast.error("Erreur de connexion au serveur. Vérifiez que l'API est accessible.")
      } else {
        toast.error(err.response?.data?.message || "Erreur lors de la création du membre")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 border-b border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <UserPlus className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Créer votre compte membre
                </h2>
                <p className="text-blue-100">
                  Complétez vos informations pour continuer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="text-white" size={20} />
            </button>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo de profil (optionnelle) */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
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
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoChange}
                  accept="image/*"
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors shadow-lg"
                  title="Ajouter une photo"
                >
                  <Camera className="text-white" size={20} />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Photo (optionnelle) - max 2MB
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Colonne gauche - Informations personnelles */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="text-blue-600" size={20} />
                  Informations personnelles
                </h3>

                {/* Nom (obligatoire) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30 transition-colors"
                    placeholder="Votre nom de famille"
                  />
                </div>

                {/* Postnom et Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Postnom
                    </label>
                    <input
                      type="text"
                      name="postnom"
                      value={formData.postnom}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30"
                      placeholder="Votre postnom"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Prénom
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30"
                      placeholder="Votre prénom"
                    />
                  </div>
                </div>

                {/* Sexe */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Sexe *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sexe: "M" }))}
                      className={`py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        formData.sexe === "M"
                          ? "bg-blue-100 text-blue-700 border-blue-300 shadow-sm"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <MaleIcon size={16} />
                      <span>Homme</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, sexe: "F" }))}
                      className={`py-3 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                        formData.sexe === "F"
                          ? "bg-pink-100 text-pink-700 border-pink-300 shadow-sm"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <FemaleIcon size={16} />
                      <span>Femme</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Colonne droite - Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Smartphone className="text-blue-600" size={20} />
                  Informations de contact
                </h3>

                {/* Téléphone (obligatoire) */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Téléphone *
                    <span className="text-xs text-gray-500 ml-2">(Identifiant unique)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handlePhoneChange}
                      required
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30"
                      placeholder="+243 81 234 5678"
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  <p className="text-xs text-gray-500">
                    Format accepté: +243 81 234 5678 ou 081 234 5678
                  </p>
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Adresse
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/30"
                      placeholder="Quartier, Commune, Ville"
                    />
                    <Home className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                </div>

                {/* Note d'information */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <UserCheck className="text-blue-600" size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Pourquoi ces informations ?
                      </p>
                      <ul className="text-xs text-blue-700 mt-1 space-y-1">
                        <li>• Le téléphone sert d'identifiant unique</li>
                        <li>• L'adresse aide pour les activités de l'église</li>
                        <li>• Vos données restent confidentielles</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                <span>Annuler</span>
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Création en cours...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>Créer mon compte et continuer</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer - Confidentialité */}
            <div className="text-center pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <p className="text-xs text-gray-600">
                  Vos informations sont sécurisées
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Nous utilisons vos données uniquement pour la gestion des membres de l'église.
                <br />
                Elles ne seront jamais partagées avec des tiers.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateMemberPopup