export default function Input({
  label,
  type = "text",
  className = "",
  ...props
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm text-gray-600 font-medium">
          {label}
        </label>
      )}
      <input
        type={type}
        className={`
          w-full px-3 py-2 rounded-lg border border-gray-300
          focus:outline-none focus:ring-2 focus:ring-primary/30
          text-sm
          ${className}
        `}
        {...props}
      />
    </div>
  )
}
