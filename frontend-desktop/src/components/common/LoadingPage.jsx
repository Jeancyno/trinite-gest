import { Loader2 } from "lucide-react"

export default function LoadingPage({ message = "Chargement de la page..." }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center  from-gray-50 to-white">
      <div className="text-center space-y-6 max-w-md px-8">
        {/* Logo ou icône */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl  from-primary to-primary/80 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">TG</span>
            </div>
            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-xl -z-10"></div>
          </div>
        </div>
        
        {/* Animation de chargement */}
        <div className="space-y-4">
          <div className="flex justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
          
          {/* Message */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
            <p className="text-gray-500">Veuillez patienter quelques instants...</p>
          </div>
          
          {/* Barre de progression simulée */}
          <div className="pt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full animate-progress"></div>
            </div>
          </div>
        </div>
        
        {/* Astuce */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-400">
            TRINITÉ-GEST • Gestion Financière & Administrative
          </p>
        </div>
      </div>
    </div>
  )
}


