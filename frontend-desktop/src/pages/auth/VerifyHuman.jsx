import { useState, useEffect, useRef } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import api from "../../api/axios"
import { useNavigate } from "react-router-dom"

export default function VerifyHuman() {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showCaptcha, setShowCaptcha] = useState(false)
  const navigate = useNavigate()
  const recaptchaRef = useRef()

  // Clé reCAPTCHA
  const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"

  useEffect(() => {
    // Nettoyer toute ancienne vérification
    localStorage.removeItem("human_verified")
    localStorage.removeItem("human_verified_expiry")
    
    const timer = setTimeout(() => {
      setShowCaptcha(true)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [])

  // Fonctions utilitaires
  const isLocalDevelopment = () => {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('192.168.') ||
           window.location.hostname.includes('10.0.')
  }

  const bypassAndRedirect = () => {
    const expiry = new Date().getTime() + (60 * 60 * 1000)
    localStorage.setItem("human_verified", "true")
    localStorage.setItem("human_verified_expiry", expiry.toString())
    setTimeout(() => navigate("/choix-paiement"), 500)
  }

  const resetCaptcha = () => {
    setToken(null)
    if (recaptchaRef.current) {
      recaptchaRef.current.reset()
    }
  }

  const handleVerify = async () => {
    if (!token) {
      setError("Veuillez valider le reCAPTCHA avant de continuer")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Envoyer la vérification CAPTCHA
      const res = await api.post("/verify-captcha", {
        token,
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
      })

      if (res.data?.success) {
        // Succès
        const expiry = new Date().getTime() + (60 * 60 * 1000)
        localStorage.setItem("human_verified", "true")
        localStorage.setItem("human_verified_expiry", expiry.toString())
        navigate("/choix-paiement")
      } else {
        setError(res.data?.message || "Échec de vérification")
        resetCaptcha()
      }
      
    } catch (err) {
      // Gestion d'erreur
      let errorMessage = "Erreur de connexion. Veuillez réessayer."
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Délai dépassé. Vérifiez votre connexion internet."
      } else if (err.response) {
        const status = err.response.status
        if (status === 400) {
          errorMessage = "Requête invalide. Rechargez la page."
        } else if (status === 403) {
          errorMessage = "Accès refusé par le serveur."
        } else if (status === 500) {
          errorMessage = "Problème serveur. Réessayez plus tard."
        }
      } else if (err.request) {
        errorMessage = "Pas de réponse du serveur. Vérifiez votre connexion."
      }
      
      setError(errorMessage)
      
      // Mode de secours pour développement
      if (isLocalDevelopment()) {
        console.log("Mode local: bypass activé")
        bypassAndRedirect()
        return
      }
      
      resetCaptcha()
    } finally {
      setLoading(false)
    }
  }

  const handleRecaptchaChange = (value) => {
    setToken(value)
    setError("")
  }

  const handleRecaptchaExpired = () => {
    setToken(null)
    setError("Le reCAPTCHA a expiré. Veuillez réessayer.")
  }

  const handleRecaptchaErrored = () => {
    setToken(null)
    setError("Erreur technique. Veuillez recharger la page.")
  }

  const handleBypass = () => {
    if (isLocalDevelopment()) {
      const expiry = new Date().getTime() + (60 * 60 * 1000)
      localStorage.setItem("human_verified", "true")
      localStorage.setItem("human_verified_expiry", expiry.toString())
      navigate("/choix-paiement")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl space-y-6 max-w-md w-full mx-4 border border-gray-200">
        {/* En-tête */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <h2 className="font-bold text-2xl text-gray-800 mb-2">
            Vérification de sécurité
          </h2>
          <p className="text-gray-600 text-sm">
            Pour continuer, veuillez confirmer que vous n'êtes pas un robot
          </p>
        </div>

        {/* Zone CAPTCHA */}
        {showCaptcha ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                onChange={handleRecaptchaChange}
                onExpired={handleRecaptchaExpired}
                onErrored={handleRecaptchaErrored}
                theme="light"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={!token || loading}
              className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${
                !token || loading
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-95"
              } text-white shadow-md`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Vérification en cours...
                </div>
              ) : (
                "Valider et continuer"
              )}
            </button>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {/* Informations légales */}
        <div className="text-xs text-gray-500 text-center space-y-2">
          <p>
            Cette vérification est protégée par Google reCAPTCHA.
            <a 
              href="https://policies.google.com/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mx-1"
            >
              Confidentialité
            </a>
            et
            <a 
              href="https://policies.google.com/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mx-1"
            >
              Conditions
            </a>.
          </p>
          <p className="text-gray-400">
            La validation est requise pour accéder à la suite.
          </p>
        </div>

        {/* Bouton de secours pour développement */}
        {isLocalDevelopment() && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={handleBypass}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Mode développement : Passer la vérification
            </button>
          </div>
        )}

        {/* Informations de débogage */}
        <div className="text-xs text-gray-400 text-center">
          <p>Page de vérification humaine - Accès sécurisé</p>
        </div>
      </div>
    </div>
  )
}