export default function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition transform hover:-translate-y-1">

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <h2 className="text-2xl font-bold mt-1">{value}</h2>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>

        <div className="p-3 rounded-xl bg-primary/10 text-primary">
          <Icon size={22} />
        </div>
      </div>

    </div>
  )
}
