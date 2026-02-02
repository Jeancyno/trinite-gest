export default function Card({ children, className = "" }) {
  return (
    <div className={`bg-white border rounded-xl p-4 ${className}`}>
      {children}
    </div>
  )
}
