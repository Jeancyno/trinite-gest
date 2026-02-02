import React, { useState, useRef, useEffect } from "react"
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save,
  X,
  Eye,
  EyeOff,
  CheckCircle,
  Settings,
  LogOut,
  Shield,
  Edit
} from "lucide-react"

// Composant ProfileEdit
function ProfileEdit({ user, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  
  const [userPhoto, setUserPhoto] = useState(user?.avatar_url || user?.avatar || null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  
  const fileInputRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, photo: "Veuillez sélectionner une image valide" }))
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, photo: "L'image doit faire moins de 5MB" }))
      return
    }

    setIsUploading(true)
    
    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUserPhoto(reader.result)
        setErrors(prev => ({ ...prev, photo: null }))
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setErrors(prev => ({ ...prev, photo: "Erreur lors de l'upload" }))
      setIsUploading(false)
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) {
      newErrors.name = "Le nom est requis"
    }
    
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        newErrors.newPassword = "Le mot de passe doit avoir au moins 6 caractères"
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = "Les mots de passe ne correspondent pas"
      }
      
      if (!formData.currentPassword) {
        newErrors.currentPassword = "Le mot de passe actuel est requis"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    
    try {
      const updateData = {
        name: formData.name,
        ...(formData.newPassword && { 
          current_password: formData.currentPassword,
          new_password: formData.newPassword 
        })
      }
      
      if (userPhoto && userPhoto.startsWith('data:image')) {
        updateData.photo = userPhoto
      }
      
      await onUpdate(updateData)
    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        submit: error.message || "Erreur lors de la mise à jour" 
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: null, submit: null }))
  }

  const passwordRequirements = [
    { label: "Au moins 6 caractères", met: formData.newPassword.length >= 6 },
    { label: "Confirmé correctement", met: formData.newPassword === formData.confirmPassword && formData.confirmPassword !== "" }
  ]

  return (
    <>
      {/* Overlay qui ferme au clic n'importe où */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] cursor-pointer"
        onClick={onClose}
      />
      
      {/* Popup d'édition avec marge en haut */}
      <div 
        className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] overflow-y-auto z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Modifier le profil</h2>
            <p className="text-sm text-gray-600 mt-1">
              Mettez à jour vos informations personnelles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Section Photo de profil */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Photo de profil</h3>
              <span className="text-xs text-blue-600 font-medium">Cliquez pour changer</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className={`relative overflow-hidden rounded-full shadow-lg ${
                    isUploading ? 'cursor-wait' : 'cursor-pointer hover:opacity-90'
                  }`}
                >
                  {userPhoto ? (
                    <img 
                      src={userPhoto} 
                      alt="Profile" 
                      className="w-28 h-28 object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <User size={40} className="text-white" />
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                    <Camera size={28} className="text-white" />
                  </div>
                </button>
                
                {isUploading && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    <Camera size={12} />
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-medium transition-colors"
                >
                  <Camera size={16} />
                  {isUploading ? "Téléchargement..." : "Changer la photo"}
                </button>
                
                {errors.photo && (
                  <p className="text-sm text-red-600 mt-2">{errors.photo}</p>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Formats acceptés: JPG, PNG, GIF (max 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Section Informations personnelles */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 mb-4">Informations personnelles</h3>
            
            {/* Nom */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <User size={16} />
                  Nom complet
                </label>
                <span className="text-xs text-gray-500">Obligatoire</span>
              </div>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Votre nom complet"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-2">{errors.name}</p>
              )}
            </div>

            {/* Username (lecture seule) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Mail size={16} />
                  Username
                </label>
                <span className="text-xs text-gray-400">Non modifiable</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={user?.username || ""}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Section Changement de mot de passe */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Changer le mot de passe</h3>
              <span className="text-xs text-gray-500">(Optionnel)</span>
            </div>

            {/* Mot de passe actuel */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Mot de passe actuel
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12 ${
                    errors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Entrez votre mot de passe actuel"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-sm text-red-600 mt-2">{errors.currentPassword}</p>
              )}
            </div>

            {/* Nouveau mot de passe */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12 ${
                    errors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Entrez le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-sm text-red-600 mt-2">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirmation */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Confirmer le nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirmez le nouveau mot de passe"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-2">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Indicateurs de validation */}
            {formData.newPassword && (
              <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm font-medium text-gray-900 mb-2">Exigences du mot de passe:</p>
                {passwordRequirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-gray-400"></div>
                    )}
                    <span className={`text-sm ${req.met ? 'text-green-600' : 'text-gray-600'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Erreur générale */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-600">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <p className="text-sm font-medium text-center">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
