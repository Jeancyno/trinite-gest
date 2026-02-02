import { Eye, MoreVertical } from "lucide-react"

export default function MemberRow({
  membre,
  photo,
  montant_total,
  montant_paye, // Ajouté depuis le backend
  devise,
  duree_mois,
  date_debut,
  status = "Actif",
}) {
  
  // Calcul du pourcentage pour la barre de progression
  const pourcentage = montant_total > 0 
    ? Math.min(Math.round((montant_paye / montant_total) * 100), 100) 
    : 0;

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'actif':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'termine':
      case 'terminé':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'annule':
      case 'annulé':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  }

  return (
    <div className="grid grid-cols-12 gap-4 items-center p-4 hover:bg-blue-50/30 transition group border-b border-gray-50 last:border-0">
      
      {/* Membre & Progression (col-span-5) */}
      <div className="col-span-5 flex items-center gap-3">
        <div className="relative">
          <img
            src={photo || "https://ui-avatars.com/api/?name=?"}
            alt={membre}
            className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm"
          />
          <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${status.toLowerCase() === 'actif' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
        </div>
        <div className="flex-1">
          <p className="font-bold text-gray-900 group-hover:text-primary transition truncate">
            {membre}
          </p>
          {/* Petite barre de progression sous le nom */}
          <div className="mt-1.5 w-full max-w-[150px]">
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-gray-500">{pourcentage}% payé</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
            {/* Dans le div de la barre de progression */}
              <div 
                className={`h-full transition-all duration-500 ${
                  pourcentage === 100 ? 'bg-emerald-500' : 
                  status.toLowerCase() === 'en retard' ? 'bg-orange-500' : 'bg-primary'
                }`}
                style={{ width: `${pourcentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Montant (col-span-2) */}
      <div className="col-span-2">
        <div className="text-sm font-black text-gray-900">
          {Number(montant_total).toLocaleString()} <span className="text-[10px] text-gray-400 font-normal">{devise}</span>
        </div>
        <div className="text-[10px] text-gray-500 italic">
          Reste: {((montant_total || 0) - (montant_paye || 0)).toLocaleString()}
        </div>
      </div>

      {/* Durée (col-span-2) */}
      <div className="col-span-2 text-center md:text-left">
        <div className="text-sm text-gray-700 font-medium">
          {duree_mois} mois
        </div>
        <div className="text-[10px] text-gray-400">
        Début: {date_debut ? new Date(date_debut).toLocaleDateString('fr-FR') : '---'}
      </div>
      </div>

      {/* Statut (col-span-2) */}
      <div className="col-span-2 text-center">
        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(status)}`}>
          {status}
        </span>
      </div>

      {/* Action (col-span-1) */}
      <div className="col-span-1 text-right">
        <button className="p-2 hover:bg-white hover:shadow-md rounded-xl text-gray-400 hover:text-primary transition-all">
          <Eye size={18} />
        </button>
      </div>

    </div>
  )
}