export default function RecentPayments() {
  const data = [
    { name: "Jean Mukendi", type: "Construction", amount: "50 USD" },
    { name: "Marie Kabila", type: "Dîme", amount: "20 USD" },
    { name: "Paul Nzambe", type: "Construction", amount: "100 USD" },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-600 mb-4">
        Derniers paiements
      </h3>

      <ul className="space-y-3">
        {data.map((item, i) => (
          <li
            key={i}
            className="flex items-center justify-between text-sm"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-xs text-gray-500">{item.type}</p>
            </div>
            <span className="font-semibold text-primary">
              {item.amount}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
