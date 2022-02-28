const Badge = ({ children, className = '' }) => {
  return (
    <span className={`px-2 py-1 text-base rounded text-white font-medium ${className}`}>
      {children}
    </span>
  )
}

export default Badge
