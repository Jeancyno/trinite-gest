import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Lock,
  Eye,
  EyeOff,
  Key,
  Shield,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Mail,
  Smartphone,
  RefreshCw
} from "lucide-react"
import api from "../../api/axios"

export default function ChangePassword() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Vérifier la force du mot de passe
  const checkPasswordStrength = (pwd) => {
    let strength = 0
    if (pwd.length >= 8) strength += 1
    if (/[A-Z]/.test(pwd)) strength += 1
    if (/[0-9]/.test(pwd)) strength += 1
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 1
    setPasswordStrength(strength)
  }

  // Envoi email
  const handleSendMail = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    if (!email) {
      setError("Veuillez entrer votre adresse email")
      setLoading(false)
      return
    }

    try {
      await api.post("/forgot-password", { email })
      setStep(2)
      setSuccess(`Un code de vérification a été envoyé à ${email}`)
    } catch {
      setError("Adresse email introuvable")
    } finally {
      setLoading(false)
    }
  }

  // Reset mot de passe
  const handleReset = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    // Validations
    if (!token) {
      setError("Veuillez entrer le code de vérification")
      setLoading(false)
      return
    }

    if (!password || !confirmPassword) {
      setError("Veuillez remplir tous les champs")
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      setLoading(false)
      return
    }

    try {
      await api.post("/reset-password", {
        email,
        token,
        password,
        password_confirmation: confirmPassword,
      })

      setSuccess("✅ Mot de passe modifié avec succès!")
      setTimeout(() => navigate("/auth/login"), 2000)
    } catch (err) {
      setError(err.response?.data?.message || "Code invalide ou expiré")
    } finally {
      setLoading(false)
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return "from-red-400 to-red-500"
      case 1: return "from-orange-400 to-orange-500"
      case 2: return "from-yellow-400 to-yellow-500"
      case 3: return "from-blue-400 to-blue-500"
      case 4: return "from-green-400 to-emerald-500"
      default: return "from-gray-400 to-gray-500"
    }
  }

  const getStrengthText = () => {
    switch (passwordStrength) {
      case 0: return { text: "Très faible", color: "text-red-600" }
      case 1: return { text: "Faible", color: "text-orange-600" }
      case 2: return { text: "Moyen", color: "text-yellow-600" }
      case 3: return { text: "Fort", color: "text-blue-600" }
      case 4: return { text: "Très fort", color: "text-emerald-600" }
      default: return { text: "", color: "" }
    }
  }

  const strengthInfo = getStrengthText()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4">
      <div className="w-full max-w-md">
       

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50">
          {/* En-tête avec gradient */}
           {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                <Shield className="text-white" size={28} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center shadow-md">
                <Key size={18} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
                Réinitialisation
              </h1>
              <p className="text-gray-500 mt-1">
                {step === 1 ? "Entrez votre email" : "Définissez votre nouveau mot de passe"}
              </p>
            </div>
          </div>
        </div>
       

          {/* Contenu */}
          <div className="p-8">
            {/* Navigation */}
            <button
              onClick={() => step === 1 ? navigate("/auth/login") : setStep(1)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group transition-colors"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">
                {step === 1 ? "Retour à la connexion" : "Modifier l'email"}
              </span>
            </button>

            {/* Messages */}
            {error && (
              <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 text-red-700 px-4 py-3.5 rounded-xl animate-fadeIn">
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 bg-gradient-to-r from-emerald-50 to-green-100 border border-emerald-200 text-emerald-700 px-4 py-3.5 rounded-xl animate-fadeIn">
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="flex-shrink-0" />
                  <span className="text-sm font-medium">{success}</span>
                </div>
              </div>
            )}

            {/* Étape 1: Email */}
            {step === 1 && (
              <form onSubmit={handleSendMail} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={20} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all duration-200 hover:bg-gray-50"
                      placeholder="admin@trinite.com"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Un code à 6 chiffres vous sera envoyé par email.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:from-primary/90 group-hover:to-primary/70 transition-all duration-300"></div>
                  <div className="relative flex items-center justify-center gap-3 py-3.5 text-white font-semibold rounded-xl shadow-lg">
                    {loading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <Mail size={20} />
                        <span>Envoyer le code</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            )}

            {/* Étape 2: Reset */}
            {step === 2 && (
              <form onSubmit={handleReset} className="space-y-6">
                {/* Code de vérification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Code de vérification
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Smartphone size={20} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      value={token}
                      onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all duration-200 text-center tracking-widest font-mono text-lg"
                      placeholder="000000"
                      disabled={loading}
                      autoFocus
                      maxLength={6}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-xs text-gray-400 font-mono">
                        {token.length}/6
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nouveau mot de passe */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        checkPasswordStrength(e.target.value)
                      }}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all duration-200 hover:bg-gray-50"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {/* Indicateur de force */}
                  {password && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Force du mot de passe</span>
                        <span className={`text-sm font-medium ${strengthInfo.color}`}>
                          {strengthInfo.text}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${getStrengthColor()} transition-all duration-500`}
                          style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={20} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-gray-50/70 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all duration-200 hover:bg-gray-50"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {password && confirmPassword && (
                    <p className={`mt-2 text-sm font-medium flex items-center gap-1 ${password === confirmPassword ? 'text-emerald-600' : 'text-red-600'}`}>
                      {password === confirmPassword ? '✓ Correspondance vérifiée' : '✗ Les mots de passe ne correspondent pas'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !token || !password || !confirmPassword}
                  className="w-full relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-600 group-hover:from-emerald-600 group-hover:to-emerald-500 transition-all duration-300"></div>
                  <div className="relative flex items-center justify-center gap-3 py-3.5 text-white font-semibold rounded-xl shadow-lg">
                    {loading ? (
                      <>
                        <RefreshCw size={20} className="animate-spin" />
                        <span>Réinitialisation...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={20} />
                        <span>Réinitialiser le mot de passe</span>
                      </>
                    )}
                  </div>
                </button>
              </form>
            )}

            {/* Lien retour */}
            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-gray-500 text-sm">
                Vous avez retrouvé votre mot de passe ?{" "}
                <button
                  onClick={() => navigate("/auth/login")}
                  className="text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Connexion sécurisée • Chiffrement SSL</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Trinité Admin • v1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}