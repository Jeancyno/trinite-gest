export default function LoadingCard({ 
  type = "card",
  count = 1 
}) {
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-100 rounded w-24"></div>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
        </div>
        
        {/* Contenu */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-100 rounded w-4/6"></div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 pt-4">
          <div className="h-8 bg-gray-200 rounded-lg flex-1"></div>
          <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
        </div>
      </div>
    </div>
  )
  
  const SkeletonList = () => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* En-tête du tableau */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/50">
        <div className="grid grid-cols-12 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded col-span-2"></div>
          ))}
        </div>
      </div>
      
      {/* Lignes */}
      <div className="divide-y divide-gray-100">
        {[...Array(count)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              {[...Array(6)].map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-4 bg-gray-${colIndex === 0 ? '300' : '200'} rounded ${
                    colIndex === 0 ? 'col-span-3' : 'col-span-2'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  
  const SkeletonStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="h-2 bg-gray-100 rounded-full"></div>
        </div>
      ))}
    </div>
  )
  
  if (type === "list") return <SkeletonList />
  if (type === "stats") return <SkeletonStats />
  
  return (
    <div className="space-y-6">
      {[...Array(count)].map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}