export default function Button({
  children,
  variant = "primary",
  type = "button",
  className = "",
  ...props
}) {
  const variants = {
    primary: "bg-primary text-grey hover:bg-opacity-90",
    secondary: "bg-secondary text-black hover:bg-opacity-90",
    outline:
      "border border-primary text-primary hover:bg-primary hover:text-white",
    danger: "bg-danger text-white hover:bg-opacity-90",
  }

  return (
    <button
      type={type}
      className={`
        px-4 py-2 rounded-lg font-medium text-sm
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary/30
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
