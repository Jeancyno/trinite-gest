import { Loader2 } from "lucide-react"

export default function LoadingButton({
  children,
  loading = false,
  loadingText = "Chargement...",
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  ...props
}) {
  const baseStyles = "font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  }
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary/90 focus:ring-2 focus:ring-primary/30",
    secondary: "bg-secondary text-gray-900 hover:bg-secondary/90 focus:ring-2 focus:ring-secondary/30",
    outline: "border border-primary text-primary hover:bg-primary/5 focus:ring-2 focus:ring-primary/30",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-300",
    ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
  }
  
  const disabledStyles = "opacity-50 cursor-not-allowed"
  
  return (
    <button
      className={`
        ${baseStyles}
        ${sizes[size]}
        ${variants[variant]}
        ${disabled || loading ? disabledStyles : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  )
}