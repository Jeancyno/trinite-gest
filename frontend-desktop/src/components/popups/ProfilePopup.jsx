// Composant principal ProfilePopup
// ProfilePopup.jsx - VERSION CORRIGÉE AVEC IMPORT REACT
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
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
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
    </div>
  )
}

// Composant principal ProfilePopup
export default function ProfilePopup({ isOpen, onClose }) {
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const user = JSON.parse(localStorage.getItem("user"))
  const role = user?.role

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.classList.add('modal-open')
    } else {
      document.body.style.overflow = 'unset'
      document.body.classList.remove('modal-open')
    }
    
    return () => {
      document.body.style.overflow = 'unset'
      document.body.classList.remove('modal-open')
    }
  }, [isOpen])

  // Ajouter un écouteur pour fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
        if (showEditProfile) {
          setShowEditProfile(false)
        }
      }
    }
    
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, showEditProfile, onClose])

  if (!isOpen) return null

  // const handleLogout = () => {
  //   setIsLoggingOut(true)
  //   localStorage.clear()
  //   window.location.href = "/auth/login"
  // }
const handleUpdateProfile = async (updateData) => {
  try {
    const token = localStorage.getItem("token")
    
    // Créer FormData
    const formData = new FormData()
    formData.append('name', updateData.name)
    
    if (updateData.new_password) {
      formData.append('current_password', updateData.current_password)
      formData.append('new_password', updateData.new_password)
      formData.append('new_password_confirmation', updateData.new_password)
    }
    
    // Gérer l'upload de la photo
    if (updateData.photo && updateData.photo.startsWith('data:image')) {
      const blob = await fetch(updateData.photo).then(r => r.blob())
      formData.append('avatar', blob, 'avatar.jpg')
    }
    
    const response = await fetch("http://127.0.0.1:8000/api/profile/update", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData
    })

    // Vérifier si la réponse est du JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text()
      console.error("Réponse non-JSON du serveur:", text.substring(0, 200))
      throw new Error("Le serveur a retourné une réponse non-JSON. Vérifiez votre API.")
    }

    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`)
    }
    
    // CORRECTION ICI : Récupérer le profil COMPLET après la mise à jour
    // Récupérer les données fraîches du serveur
    const profileResponse = await fetch("http://127.0.0.1:8000/api/profile", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      
      // Mettre à jour localStorage avec TOUTES les données fraîches
      const currentUser = JSON.parse(localStorage.getItem("user"))
      const updatedUser = {
        ...currentUser,
        ...profileData.data, // Prendre toutes les données du profil
        name: data.user?.name || updateData.name,
        avatar_url: profileData.data?.avatar_url || data.user?.avatar_url,
        avatar: profileData.data?.avatar_url || data.user?.avatar_url
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))
      console.log("Profil mis à jour avec succès:", updatedUser)
    } else {
      // Fallback si l'API /profile n'existe pas
      const currentUser = JSON.parse(localStorage.getItem("user"))
      const updatedUser = { 
        ...currentUser, 
        name: data.user?.name || updateData.name,
        avatar_url: data.user?.avatar_url,
        avatar: data.user?.avatar_url
      }
      localStorage.setItem("user", JSON.stringify(updatedUser))
    }
    
    // Fermer le popup d'édition
    setShowEditProfile(false)
    
    // Afficher un message de succès
    alert("Profil mis à jour avec succès!")
    
    // Recharger la page pour voir les changements
    window.location.reload()
    
    return data
    
  } catch (error) {
    console.error("Erreur détaillée:", error)
    throw new Error(`Échec de la mise à jour: ${error.message}`)
  }
}

  return (
    <>
      {/* Overlay qui ferme au clic n'importe où */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] cursor-pointer"
        onClick={(e) => {
          onClose()
          if (showEditProfile) {
            setShowEditProfile(false)
          }
        }}
      />
      
      {/* Popup principal */}
      <div 
        className="fixed top-4 right-4 bg-white rounded-2xl shadow-2xl w-96 max-w-[95vw] z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-center border-b">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Profil Utilisateur</h3>
            <p className="text-sm text-gray-600 mt-1">Informations personnelles</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditProfile(true)}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
              title="Modifier le profil"
            >
              <Settings size={18} className="text-blue-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Photo et nom */}
        <div className="px-6 py-6 text-center">
          <div className="relative w-28 h-28 mx-auto mb-4 group ">
            {user?.avatar_url || user?.avatar ? (
              <div className="relative">
                <img 
                  src={user.avatar_url || user.avatar} 
                  alt="Profile" 
                  className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className=" absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
            ) : (
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center border-4 border-white shadow-lg">
                <span className="text-white text-3xl font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || "A"}
                </span>
              </div>
            )}
            
            {/* Badge de rôle */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
              <Shield size={18} className="text-white" />
            </div>
          </div>
          
          <h3 className="font-bold text-gray-900 text-xl">{user?.name || "Administrateur"}</h3>
          <div className="flex items-center justify-center gap-2 mt-2">
            <p className="text-blue-600 font-medium capitalize">
              {role === 'super_admin' ? 'Super Administrateur' : 
               role === 'pasteur' ? 'Pasteur' : 
               role === 'tresorier' ? 'Trésorier' : 
               role === 'secretaire' ? 'Secrétaire' : 'Utilisateur'}
            </p>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs text-green-600 font-medium">Connecté</span>
            </div>
          </div>
        </div>

        {/* Informations */}
        <div className="px-6 space-y-4">
          {/* <div 
            className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100 hover:bg-blue-100/50 transition-colors cursor-pointer group"
            onClick={() => setShowEditProfile(true)}
          >
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium text-gray-900">{user?.username}</p>
            </div>
            <Edit size={16} className="text-gray-400 group-hover:text-blue-500" />
          </div> */}

          <div 
            className="flex items-center gap-3 p-4 bg-purple-50/50 rounded-xl border border-purple-100 hover:bg-purple-100/50 transition-colors cursor-pointer group"
            onClick={() => setShowEditProfile(true)}
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <User size={20} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Rôle</p>
              <p className="font-medium text-gray-900 capitalize">
                {role?.replace('_', ' ')}
              </p>
            </div>
            <Edit size={16} className="text-gray-400 group-hover:text-purple-500" />
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="p-6 pt-4 border-t border-gray-200 space-y-3">
          <button
            onClick={() => setShowEditProfile(true)}
            className="flex items-center justify-center gap-3 w-full p-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 font-medium"
          >
            <Settings size={18} />
            Modifier mon profil
          </button>
          
          {/* <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`flex items-center justify-center gap-3 w-full p-3.5 rounded-xl font-medium transition-all duration-200 ${
              isLoggingOut 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:shadow-lg hover:scale-[1.02]'
            }`}
          >
            <LogOut size={18} />
            {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
          </button> */}
        </div>
      </div>

      {/* Popup d'édition de profil */}
      {showEditProfile && (
        <ProfileEdit 
          user={user}
          onClose={() => setShowEditProfile(false)}
          onUpdate={handleUpdateProfile}
        />
      )}
    </>
  )
}