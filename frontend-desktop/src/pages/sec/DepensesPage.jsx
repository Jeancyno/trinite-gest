import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { Save, AlertCircle, Wallet, History, ArrowDownCircle, CheckCircle } from 'lucide-react';

const DepensesPage = () => {
    const [loading, setLoading] = useState(false);
    const [soldes, setSoldes] = useState({ 
        dime: { USD: 0, CDF: 0 }, 
        construction: { USD: 0, CDF: 0 } 
    });
    const [depenses, setDepenses] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    
    const [form, setForm] = useState({
        motif: '',
        montant: '',
        devise: 'USD',
        source: 'construction',
        date_depense: new Date().toISOString().split('T')[0],
        details: ''
    });

    // 1. Charger les soldes et l'historique au chargement
    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        fetchSoldes();
        fetchDepenses();
    };

    const fetchSoldes = async () => {
        try {
            const res = await axios.get('/depenses/soldes');
            if (res.data.success) setSoldes(res.data.soldes);
        } catch (err) {
            console.error("Erreur soldes:", err);
        }
    };

    const fetchDepenses = async () => {
        try {
            const res = await axios.get('/depenses');
            if (res.data.success) setDepenses(res.data.data.data);
        } catch (err) {
            console.error("Erreur historique:", err);
        }
    };

    // 2. Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.post('/depenses', form);
            if (response.data.success) {
                setMessage({ type: 'success', text: 'Dépense enregistrée avec succès !' });
                setForm({ ...form, motif: '', montant: '', details: '' }); // Réinitialiser
                refreshData(); // Mettre à jour les soldes et la liste
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Erreur lors de l'enregistrement";
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* EN-TÊTE */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-3">
                    <ArrowDownCircle className="text-red-500" size={32} />
                    Gestion des Sorties de Caisse
                </h1>
                <p className="text-gray-500 mt-1">Enregistrez les dépenses et suivez les soldes en temps réel.</p>
            </div>

            {/* WIDGETS DE SOLDE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Carte Caisse Dîme */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold uppercase tracking-widest opacity-80">Caisse Dîmes</span>
                        <Wallet size={24} className="opacity-80" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-3xl font-bold">{soldes.dime.USD.toLocaleString()} $</p>
                            <p className="text-xs mt-1 opacity-70">Solde disponible USD</p>
                        </div>
                        <div className="border-l border-white/20 pl-4">
                            <p className="text-3xl font-bold">{soldes.dime.CDF.toLocaleString()} FC</p>
                            <p className="text-xs mt-1 opacity-70">Solde disponible CDF</p>
                        </div>
                    </div>
                </div>

                {/* Carte Caisse Construction */}
                <div className="bg-gradient-to-br from-orange-500 to-red-600 p-6 rounded-2xl text-white shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold uppercase tracking-widest opacity-80">Caisse Construction</span>
                        <History size={24} className="opacity-80" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-3xl font-bold">{soldes.construction.USD.toLocaleString()} $</p>
                            <p className="text-xs mt-1 opacity-70">Solde disponible USD</p>
                        </div>
                        <div className="border-l border-white/20 pl-4">
                            <p className="text-3xl font-bold">{soldes.construction.CDF.toLocaleString()} FC</p>
                            <p className="text-xs mt-1 opacity-70">Solde disponible CDF</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FORMULAIRE */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-6">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">Saisir une dépense</h2>
                        
                        {message.text && (
                            <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
                                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                                {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                                <p className="text-sm font-medium">{message.text}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Source des fonds</label>
                                <select 
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={form.source}
                                    onChange={(e) => setForm({...form, source: e.target.value})}
                                >
                                    <option value="construction">Caisse Construction</option>
                                    <option value="dime">Caisse Dîmes</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Montant</label>
                                    <input 
                                        type="number" required placeholder="0.00"
                                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl outline-none"
                                        value={form.montant}
                                        onChange={(e) => setForm({...form, montant: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1">Devise</label>
                                    <select 
                                        className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl outline-none"
                                        value={form.devise}
                                        onChange={(e) => setForm({...form, devise: e.target.value})}
                                    >
                                        <option value="USD">USD ($)</option>
                                        <option value="CDF">CDF (FC)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Motif / Libellé</label>
                                <input 
                                    type="text" required placeholder="Ex: Achat de 5 sacs de ciment"
                                    className="w-full p-3 bg-gray-50 border border-gray-300 rounded-xl outline-none"
                                    value={form.motif}
                                    onChange={(e) => setForm({...form, motif: e.target.value})}
                                />
                            </div>

                            <button 
                                type="submit" disabled={loading}
                                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-200 transition all ${
                                    loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                                } flex items-center justify-center gap-2`}
                            >
                                {loading ? "Traitement..." : <><Save size={20}/> Valider la dépense</>}
                            </button>
                        </form>
                    </div>
                </div>

                {/* TABLEAU HISTORIQUE */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Dernières sorties</h2>
                            <button onClick={refreshData} className="text-blue-600 text-sm font-medium hover:underline">Actualiser</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Date</th>
                                        <th className="px-6 py-4 font-semibold">Caisse</th>
                                        <th className="px-6 py-4 font-semibold">Désignation</th>
                                        <th className="px-6 py-4 font-semibold">Montant</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {depenses.length > 0 ? depenses.map((d) => (
                                        <tr key={d.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(d.date_depense).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                                    d.source === 'dime' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                    {d.source}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm font-bold text-gray-800">{d.motif}</p>
                                                <p className="text-[10px] text-gray-400">Par: {d.secretaire?.name || 'Secrétaire'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-red-600">
                                                    -{parseFloat(d.montant).toLocaleString()} {d.devise}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">
                                                Aucune dépense enregistrée pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DepensesPage;