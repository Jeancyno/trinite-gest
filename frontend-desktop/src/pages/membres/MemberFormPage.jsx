// pages/membres/MemberFormPage.jsx
import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { 
  User, 
  Save, 
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import api from "../../api/axios"
import { toast } from "react-toastify"

export default function MemberFormPage() {

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
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    nom: "",
    postnom: "",
    prenom: "",
    sexe: "",
    telephone: "",
    adresse: ""
  })

  useEffect(() => {
    if (isEdit) {
      loadMember()
    }
  }, [id])

  const loadMember = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/membres/${id}`)
      setFormData(response.data.data || response.data)
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Erreur lors du chargement du membre")
      navigate("/membres")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      if (isEdit) {
        await api.put(`/membres/${id}`, formData)
        toast.success("Membre mis à jour avec succès")
      } else {
        await api.post("/membres", formData)
        toast.success("Membre créé avec succès")
      }
      
      setTimeout(() => navigate("/membres"), 1500)
      
    } catch (error) {
      console.error("Erreur:", error)
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {})
        toast.error("Veuillez corriger les erreurs")
      } else {
        toast.error(isEdit 
          ? "Erreur lors de la mise à jour" 
          : "Erreur lors de la création"
        )
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading && isEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate("/membres")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Retour à la liste
        </button>

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h1 className="text-2xl font-bold mb-6">
            {isEdit ? "Modifier le membre" : "Nouveau membre"}
          </h1>

          {/* Formulaire identique à AddMemberPage */}
          {/* ... */}
        </div>
      </div>
    </div>
  )
}