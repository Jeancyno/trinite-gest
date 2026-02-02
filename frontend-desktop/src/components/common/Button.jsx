export default function Button({ children, variant = "primary" }) {
  const styles = {
    primary: "bg-primary text-white",
    secondary: "bg-secondary text-black",
    danger: "bg-danger text-white",
  }

  return (
    <button className={`px-4 py-2 rounded-lg ${styles[variant]}`}>
      {children}
    </button>
  )
}
