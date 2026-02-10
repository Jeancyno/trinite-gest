import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, Coins, FileBarChart,
  Settings, ChevronRight, LogOut, User,
} from "lucide-react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {

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
  const [openMenu, setOpenMenu] = useState(null);
  const [role, setRole] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        let rawRole = "";

        // Si c'est un objet, on prend la propriété .role
        if (typeof parsed === 'object' && parsed !== null) {
          rawRole = parsed.role || "";
        } 
        // Si c'est juste du texte (comme dans tes logs), on le prend directement
        else if (typeof parsed === 'string') {
          rawRole = parsed;
        }

        // NORMALISATION CRUCIALE : Minuscules + Enlever les accents + Espaces -> _
        const normalizedRole = rawRole
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // "secrétaire" -> "secretaire"
          .trim()
          .replace(/\s+/g, "_");
        
        console.log("Rôle final traité pour les menus:", normalizedRole);
        setRole(normalizedRole);

      } catch (e) {
        // Si le JSON.parse échoue car c'est déjà du texte brut
        const normalizedRole = storedUser
          .replace(/"/g, "") // Enlever les guillemets éventuels
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .trim()
          .replace(/\s+/g, "_");
          
        setRole(normalizedRole);
      }
    }
  }, [location]);

  const logout = () => {
    localStorage.clear();
    navigate("/auth/login");
    window.location.reload();
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 h-screen flex flex-col shadow-lg">
      {/* En-tête avec logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">TG</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TRINITÉ-GEST
            </h1>
            <p className="text-xs text-gray-500 font-medium">Montagne de Prière</p>
          </div>
        </div>
      </div>

      {/* Section navigation */}
      <div className="flex-1 px-4 py-6 space-y-1.5">
        {/* DASHBOARD */}
        {["pasteur", "secretaire", "super_admin"].includes(role) && (
          <SidebarLink to="/" icon={LayoutDashboard} label="Tableau de bord" />
        )}
        {/* RAPPORT */}
        {["pasteur", "secretaire", "super_admin"].includes(role) && (
          <SidebarLink to="/rapports/rapports" icon={FileBarChart} label="Rapports" />
        )}

    {/* Section MEMBRES - Accessible par Admin, Secrétaire ET Pasteur */}
      {["super_admin", "secretaire", "pasteur"].includes(role) && (
        <div className="space-y-1">
          <button 
            onClick={() => setOpenMenu(openMenu === "membre" ? null : "membre")} 
            className="flex w-full items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-gray-700"
          >
            <span className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                <Users size={18} className="text-blue-600" />
              </div>
              <span className="font-medium">Membres</span>
            </span>
            <ChevronRight 
              size={16} 
              className={`text-gray-400 transition-transform duration-300 ${openMenu === "membre" ? "rotate-90" : ""}`}
            />
          </button>
          
          {openMenu === "membre" && (
            <div className="ml-10 space-y-0.5 animate-fadeIn">
              {/* Tout le monde (y compris le pasteur) voit la liste */}
              <SidebarSubLink to="/membres" label="Liste des membres" />
              
              {/* Le bouton "Ajouter" est masqué pour le pasteur */}
              {role !== "pasteur" && (
                <SidebarSubLink to="/membres/create" label="Ajouter un membre" />
              )}
            </div>
          )}
        </div>
      )}
         {/* CONSTRUCTION */}
        {["super_admin","secretaire", "pasteur"].includes(role) && (
          <div className="space-y-1">
            <button 
              onClick={() => setOpenMenu(openMenu === "construction" ? null : "construction")} 
              className="flex w-full items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 text-gray-700"
            >
              <span className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100">
                  <Users size={18} className="text-blue-600" />
                </div>
                <span className="font-medium">Construction</span>
              </span>
              <ChevronRight 
                size={16} 
                className={`text-gray-400 transition-transform duration-300 ${openMenu === "construction" ? "rotate-90" : ""}`}
              />
            </button>
            
            {openMenu === "construction" && (
              <div className="ml-10 space-y-0.5 animate-fadeIn">
             <SidebarSubLink to="/construction/paiement" label="Engagements" />
              {/* <SidebarSubLink to="/construction/engagements" label="Paiement" /> */}
              <SidebarSubLink to="/construction/EtatEngagements" label="Etat d'Engagement" />
              </div>
            )}
          </div>
        )}

        {/* DÎME */}
        {["pasteur", "super_admin", "tresorier"].includes(role) && (
          <SidebarLink to="/dime/paiement" icon={Coins} label="Gestion des dîmes" />
        )}
        {/* DEPENSE */}
        {["super_admin", "secretaire"].includes(role) && (
          <SidebarLink to="/sec/DepensesPage" icon={Coins} label="Depenses" />
        )}

        {/* PARAMÈTRES */}
        {["pasteur", "secretaire", "super_admin"].includes(role) && (
          <SidebarLink to="/admin/parametre" icon={Settings} label="Paramètres" />
        )}
      </div>

      {/* Section déconnexion */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button 
          onClick={logout} 
          className="group w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-100 hover:border-red-200"
        >
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-red-100 to-pink-100 group-hover:from-red-200 group-hover:to-pink-200">
            <LogOut size={18} className="text-red-600 group-hover:text-red-700" />
          </div>
          <span className="font-medium text-red-600 group-hover:text-red-700">Déconnexion</span>
        </button>
        
      
      </div>
    </aside>
  );
}

// Sous-composants avec design amélioré (CORRIGÉ)
function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-3 px-4 py-3 rounded-xl text-sm 
        transition-all duration-200 group
        ${isActive 
          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
          : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-600 hover:shadow-sm'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <div className={`
            p-1.5 rounded-lg transition-all duration-200
            ${isActive 
              ? 'bg-white/20' 
              : 'bg-gradient-to-r from-gray-100 to-blue-100 group-hover:from-blue-100 group-hover:to-indigo-100'
            }
          `}>
            <Icon 
              size={18} 
              className={isActive ? 'text-white' : 'text-gray-600 group-hover:text-blue-600'} 
            />
          </div>
          <span className="font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function SidebarSubLink({ to, label }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => `
        flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm 
        transition-all duration-200
        ${isActive 
          ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 font-semibold border border-blue-100' 
          : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-gray-800'
        }
      `}
    >
      {({ isActive }) => (
        <>
          <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}