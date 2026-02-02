import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api  from '../../api/axios'; 

const EtatEngagements = () => {

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
    const [listes, setListes] = useState({
        finalises: [],
        en_attente: [],
        non_payes: []
    });
    const [statistiques, setStatistiques] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('tous'); // 'tous', 'finalises', 'en_attente', 'non_payes'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await api.get('/membres/etat-engagements');
            if (response.data.success) {
                setListes(response.data.data);
                setStatistiques(response.data.data.statistiques || {});
            } else {
                setError('Erreur lors du chargement des données');
            }
        } catch (error) {
            console.error("Erreur lors du chargement des données", error);
            setError('Impossible de charger les données. Vérifiez votre connexion.');
        } finally {
            setLoading(false);
        }
    };

    // Filtrer les données selon le terme de recherche
    const filterData = (data) => {
        if (!searchTerm) return data;
        
        const term = searchTerm.toLowerCase();
        return data.filter(item => 
            item.nom_complet.toLowerCase().includes(term) ||
            item.telephone.includes(term) ||
            item.montant_promis.toString().includes(term)
        );
    };

    // Obtenir les données filtrées
    const getFilteredData = () => {
        switch (filter) {
            case 'finalises':
                return filterData(listes.finalises);
            case 'en_attente':
                return filterData(listes.en_attente);
            case 'non_payes':
                return filterData(listes.non_payes);
            default:
                return [
                    ...filterData(listes.finalises),
                    ...filterData(listes.en_attente),
                    ...filterData(listes.non_payes)
                ];
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Chargement de l'état des engagements...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-xl mb-4">⚠️</div>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button 
                        onClick={fetchData}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const filteredData = getFilteredData();

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* En-tête avec statistiques */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Suivi des Engagements</h1>
                <p className="text-gray-600 mb-6">
                    Vue d'ensemble des engagements et paiements des membres
                </p>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-gray-800">{statistiques.total_membres || 0}</div>
                        <div className="text-sm text-gray-500">Membres engagés</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-green-600">
                            ${statistiques.total_montant_paye?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-500">Total payé</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-orange-600">
                            ${statistiques.total_montant_restant?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-500">Total restant</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow">
                        <div className="text-2xl font-bold text-blue-600">
                            ${statistiques.total_montant_promis?.toLocaleString() || 0}
                        </div>
                        <div className="text-sm text-gray-500">Total promis</div>
                    </div>
                </div>

                {/* Filtres et recherche */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Rechercher par nom, téléphone ou montant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setFilter('tous')}
                            className={`px-4 py-2 rounded-lg ${filter === 'tous' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            Tous ({listes.finalises.length + listes.en_attente.length + listes.non_payes.length})
                        </button>
                        <button
                            onClick={() => setFilter('finalises')}
                            className={`px-4 py-2 rounded-lg ${filter === 'finalises' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            Finalisés ({listes.finalises.length})
                        </button>
                        <button
                            onClick={() => setFilter('en_attente')}
                            className={`px-4 py-2 rounded-lg ${filter === 'en_attente' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            En cours ({listes.en_attente.length})
                        </button>
                        <button
                            onClick={() => setFilter('non_payes')}
                            className={`px-4 py-2 rounded-lg ${filter === 'non_payes' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border'}`}
                        >
                            Non payés ({listes.non_payes.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Tableau principal (version filtrée) */}
            {filter === 'tous' ? (
                // Vue avec les 3 sections séparées
                <>
                    {/* Section Finalisés */}
                    <SectionEngagements 
                    
                        titre="✅ Engagements Finalisés"
                        couleur="green"
                        data={filterData(listes.finalises)}
                        type="finalises"
                    />

                    {/* Section En Attente */}
                    <SectionEngagements 
                        titre="⏳ En cours de paiement"
                        couleur="orange"
                        data={filterData(listes.en_attente)}
                        type="en_attente"
                    />

                    {/* Section Non Payés */}
                    <SectionEngagements 
                        titre="❌ Rien versé"
                        couleur="red"
                        data={filterData(listes.non_payes)}
                        type="non_payes"
                    />
                </>
            ) : (
                // Vue unique filtrée
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 text-left">Membre</th>
                                <th className="p-4 text-left">Téléphone</th>
                                <th className="p-4 text-right">Montant promis</th>
                                <th className="p-4 text-right">Montant payé</th>
                                <th className="p-4 text-right">Reste à payer</th>
                                <th className="p-4 text-center">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, index) => (
                                <EngagementRow key={index} item={item} />
                            ))}
                        </tbody>
                    </table>
                    {filteredData.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Aucun engagement trouvé pour ce filtre
                        </div>
                    )}
                </div>
            )}

            {/* Bouton d'export/rafraîchissement */}
            <div className="mt-8 flex justify-between">
                <button
                    onClick={fetchData}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Rafraîchir
                </button>
                <button
                    onClick={() => alert('Export PDF à implémenter')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Exporter PDF
                </button>
            </div>
        </div>
    );
};

// Composant pour une section d'engagements
const SectionEngagements = ({ titre, couleur, data, type }) => {
    if (data.length === 0) return null;

    const colorClasses = {
        green: { bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
        red: { bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' }
    };

    const colors = colorClasses[couleur] || colorClasses.green;

    return (
        <section className="mb-10">
            <h2 className={`text-xl font-semibold mb-4 ${colors.text}`}>
                {titre} ({data.length})
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className={colors.bg}>
                        <tr>
                            <th className="p-4 text-left">Membre</th>
                            <th className="p-4 text-left">Téléphone</th>
                            <th className="p-4 text-right">Montant promis</th>
                            {type === 'en_attente' && <th className="p-4 text-right">Payé</th>}
                            {type === 'en_attente' && <th className="p-4 text-right">Reste</th>}
                            {type !== 'en_attente' && <th className="p-4 text-right">Montant</th>}
                            <th className="p-4 text-center">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <EngagementRow key={index} item={item} type={type} />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

// Composant pour une ligne d'engagement
const EngagementRow = ({ item, type }) => {
    const getStatusBadge = () => {
        if (type === 'finalises') {
            return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Réglé</span>;
        } else if (type === 'en_attente') {
            return (
                <div className="flex flex-col items-center">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs mb-1">
                        En cours ({item.pourcentage_paye || 0}%)
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${item.pourcentage_paye || 0}%` }}
                        ></div>
                    </div>
                </div>
            );
        } else {
            return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs">Non payé</span>;
        }
    };

    return (
        <tr className="hover:bg-gray-50 border-b">
            <td className="p-4">
                <div className="font-medium">{item.nom_complet}</div>
                <div className="text-xs text-gray-500">Engagement #{item.promesse_id}</div>
            </td>
            <td className="p-4">{item.telephone}</td>
            <td className="p-4 text-right font-medium">{item.montant_promis.toLocaleString()} {item.devise}</td>
            
            {type === 'en_attente' ? (
                <>
                    <td className="p-4 text-right text-green-600">
                        {item.montant_paye.toLocaleString()} {item.devise}
                    </td>
                    <td className="p-4 text-right font-bold text-orange-600">
                        {item.montant_restant.toLocaleString()} {item.devise}
                    </td>
                </>
            ) : type === 'non_payes' ? (
                <td className="p-4 text-right font-bold text-red-600">
                    {item.montant_promis.toLocaleString()} {item.devise}
                </td>
            ) : (
                <td className="p-4 text-right text-green-600">
                    {item.montant_paye.toLocaleString()} {item.devise}
                </td>
            )}
            
            <td className="p-4 text-center">{getStatusBadge()}</td>
        </tr>
    );
};

export default EtatEngagements;