import { useState } from "react"

export default function EngagementForm({ onSubmit }) {
  const [photoPreview, setPhotoPreview] = useState(null)

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (file) setPhotoPreview(URL.createObjectURL(file))
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>

      <h2 className="text-xl font-semibold">
        Nouvel engagement
      </h2>

      <input
        placeholder="Nom du fidèle"
        className="w-full px-4 py-2 border rounded-xl"
        required
      />

      <input type="file" accept="image/*" onChange={handlePhoto} />

      {photoPreview && (
        <img
          src={photoPreview}
          className="w-20 h-20 rounded-full object-cover border"
        />
      )}

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="Montant"
          className="px-4 py-2 border rounded-xl"
          required
        />
        <select className="px-4 py-2 border rounded-xl">
          <option>USD</option>
          <option>CDF</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          placeholder="Durée (mois)"
          defaultValue={6}
          className="px-4 py-2 border rounded-xl"
        />
        <input
          type="date"
          className="px-4 py-2 border rounded-xl"
        />
      </div>

      <textarea
        placeholder="Observation (optionnel)"
        className="w-full px-4 py-2 border rounded-xl"
      />

      <button className="bg-primary text-white w-full py-2 rounded-xl hover:bg-primary/90 transition">
        Enregistrer
      </button>
    </form>
  )
}
