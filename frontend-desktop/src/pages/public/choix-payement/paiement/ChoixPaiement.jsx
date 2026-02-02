import { useNavigate } from "react-router-dom"

export default function ChoixPaiement() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-full max-w-md space-y-6">

        <h1 className="text-2xl font-bold text-center">
          Que voulez-vous payer ?
        </h1>

        <button
          onClick={() => navigate("/public/dime")}
          className="w-full bg-blue-600 text-white py-3 rounded-lg"
        >
          Payer la Dîme
        </button>

        <button
          onClick={() => navigate("/public/engagement")}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          Payer un Engagement
        </button>

      </div>
    </div>
  )
}
