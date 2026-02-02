import { useState, useRef } from "react"
import { 
  Settings, 
  User, 
  Shield, 
  Bell, 
  Lock, 
  Globe, 
  CreditCard,
  Download,
  Edit2,
  Mail,
  Phone,
  Key,
  Eye,
  EyeOff,
  Save,
  Check,
  X,
  Camera,
  Upload
} from "lucide-react"
// import EditProfilePopup from "./EditProfilePopup" // Importe le composant de popup

export default function SettingsPage() {

       useEffect(() => {
      const syncData = () => {
        console.log("Synchronisation détectée...");
        // Appelle ici tes fonctions de chargement
        if (typeof fetchDashboardData === 'function') {
          fetchDashboardData(); 
        }
      };
    
      // Écouter le signal envoyé par la Topbar
      window.addEventListener("app-synchronize", syncData);
    
      // Nettoyer l'écouteur quand on quitte la page
      return () => window.removeEventListener("app-synchronize", syncData);
    }, []);
  // États pour la popup
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false)
  const editButtonRef = useRef(null)

  // États pour la page
  const [activeTab, setActiveTab] = useState("profile")
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    security: true
  })
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [language, setLanguage] = useState("fr")
  const [timezone, setTimezone] = useState("Africa/Kinshasa")

  const handleNotificationToggle = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handlePasswordChange = () => {
    // Logique de changement de mot de passe
    console.log("Changement de mot de passe...")
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "preferences", label: "Préférences", icon: Globe },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Settings className="text-primary" size={24} />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Paramètres</h1>
          </div>
          <p className="text-gray-600">Gérez vos préférences et vos informations personnelles</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-6">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={20} />
                      <span>{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Section Profil */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Informations personnelles</h2>
                      <p className="text-gray-600">Mettez à jour vos coordonnées et votre photo de profil</p>
                    </div>
                    <button
                      ref={editButtonRef}
                      onClick={() => setIsEditPopupOpen(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium"
                    >
                      <Edit2 size={18} />
                      Modifier le profil
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Carte profil */}
                    <div className=" from-primary/5 to-primary/10 rounded-2xl p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-32 h-32 rounded-full  from-primary to-primary/80 text-white flex items-center justify-center font-bold text-4xl shadow-lg mb-4">
                          A
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">Administrateur</h3>
                        <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                          <Shield size={14} />
                          <span className="text-sm font-medium">Super Admin</span>
                        </div>
                        <p className="text-gray-600 text-sm">Dernière connexion : Aujourd'hui, 10:30</p>
                      </div>
                    </div>

                    {/* Informations détaillées */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="text-gray-400" size={18} />
                          <span className="text-sm font-medium text-gray-500">Email</span>
                        </div>
                        <p className="text-gray-900 font-medium">admin@trinite.com</p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Phone className="text-gray-400" size={18} />
                          <span className="text-sm font-medium text-gray-500">Téléphone</span>
                        </div>
                        <p className="text-gray-900 font-medium">+243 81 234 5678</p>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard className="text-gray-400" size={18} />
                          <span className="text-sm font-medium text-gray-500">ID Membre</span>
                        </div>
                        <p className="text-gray-900 font-medium">ADM-001</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export des données */}
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Export des données</h3>
                  <p className="text-gray-600 mb-4">Téléchargez une copie de toutes vos données personnelles</p>
                  <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium">
                    <Download size={18} />
                    Exporter mes données
                  </button>
                </div>
              </div>
            )}

            {/* Section Sécurité */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Sécurité du compte</h2>
                  
                  {/* Changer mot de passe */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Changer le mot de passe</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mot de passe actuel
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                            placeholder="Entrez votre mot de passe actuel"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nouveau mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                            placeholder="Entrez le nouveau mot de passe"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Confirmer le nouveau mot de passe
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-12"
                            placeholder="Confirmez le nouveau mot de passe"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handlePasswordChange}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium"
                      >
                        <Key size={18} />
                        Mettre à jour le mot de passe
                      </button>
                    </div>
                  </div>

                  {/* Authentification à deux facteurs */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentification à deux facteurs</h3>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">2FA activée</p>
                        <p className="text-sm text-gray-600">Ajoute une couche de sécurité supplémentaire</p>
                      </div>
                      <div className="flex items-center gap-2 text-green-600">
                        <Check size={20} />
                        <span className="font-medium">Activée</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Notifications */}
            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Préférences de notifications</h2>
                
                <div className="space-y-4">
                  {[
                    { id: "email", label: "Notifications par email", desc: "Recevoir des emails pour les activités importantes" },
                    { id: "push", label: "Notifications push", desc: "Notifications en temps réel sur votre appareil" },
                    { id: "sms", label: "Notifications SMS", desc: "Recevoir des SMS pour les alertes urgentes" },
                    { id: "security", label: "Alertes de sécurité", desc: "Notifications concernant la sécurité de votre compte" }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => handleNotificationToggle(item.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 ${
                          notifications[item.id] ? 'bg-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                            notifications[item.id] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section Préférences */}
            {activeTab === "preferences" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Préférences générales</h2>
                  
                  <div className="space-y-6">
                    {/* Langue */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Langue
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="sw">Swahili</option>
                        <option value="ln">Lingala</option>
                      </select>
                    </div>

                    {/* Fuseau horaire */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Fuseau horaire
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      >
                        <option value="Africa/Kinshasa">Kinshasa (GMT+1)</option>
                        <option value="Africa/Lubumbashi">Lubumbashi (GMT+2)</option>
                        <option value="Europe/Paris">Paris (GMT+1)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl shadow-sm p-6 border border-red-200">
                  <h3 className="text-lg font-bold text-red-700 mb-4">Zone dangereuse</h3>
                  <div className="space-y-3">
                    <p className="text-gray-600">Ces actions sont irréversibles. Soyez certain de ce que vous faites.</p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium">
                        Désactiver le compte temporairement
                      </button>
                      <button className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-medium">
                        Supprimer définitivement le compte
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup d'édition du profil */}
      {/* <EditProfilePopup
        isOpen={isEditPopupOpen}
        onClose={() => setIsEditPopupOpen(false)}
        triggerButtonRef={editButtonRef}
      /> */}
    </div>
  )
}