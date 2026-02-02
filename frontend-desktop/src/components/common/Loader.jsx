import { Loader2 } from "lucide-react"

export default function Loading({ 
  size = "md", 
  text = "Chargement...", 
  fullScreen = false 
}) {
  const sizes = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  }

  const textSizes = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`${sizes.xl} text-primary animate-spin`} />
          <p className={`${textSizes.lg} text-gray-600 font-medium`}>{text}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Loader2 className={`${sizes[size]} text-primary animate-spin`} />
      {text && <span className={`${textSizes[size]} text-gray-600`}>{text}</span>}
    </div>
  )
}