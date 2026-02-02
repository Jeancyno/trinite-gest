import { useState } from "react"
import api from "../../api/axios"
import { useNavigate } from "react-router-dom"
import { Lock, User, Eye, EyeOff, LogIn } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Veuillez remplir tous les champs")
      setLoading(false)
      return
    }

 try {
  localStorage.clear();

  const res = await api.post("/login", { username, password });
  console.log("LOGIN RESPONSE:", res.data);

  // Correction des clés selon ton AuthController PHP
  const token = res.data.access_token;
  const userObj = res.data.user; // C'est un objet { id, name, role, avatar... }
  
  if (!token || !userObj) throw new Error("Données de connexion incomplètes");

  const role = userObj.role;

  // Stockage propre
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(userObj)); // On stocke l'objet complet
  localStorage.setItem("role", role);

  api.defaults.headers.common.Authorization = `Bearer ${token}`;

  // 🎯 REDIRECTION PAR ROLE
  if (role === "tresorier") {
    navigate("/dime/paiement");
  } else {
    navigate("/");
  }

} catch (err) {
  console.error("Erreur détaillée:", err);
  setError(err.response?.data?.message || "Identifiants incorrects ou erreur serveur");
} finally {
  setLoading(false);
}

  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-8 pb-0 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Se Connecter</h1>
            <p className="text-gray-500 text-sm mt-2">Accédez à votre espace d'administration</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm animate-pulse">
                {error}
              </div>
            )}

            {/* Champ Utilisateur */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Nom d'utilisateur
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Ex: admin"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  disabled={loading}
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button 
                type="button"
                onClick={() => navigate("/auth/ChangePassword")}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline"
              >
                Mot de passe oublié ?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-3 py-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Vérification...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="px-8 pb-6">
            <div className="pt-4 border-t border-gray-100 text-center">
              <p className="text-gray-400 text-xs">
                © {new Date().getFullYear()} Trinité Admin • Version 1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}