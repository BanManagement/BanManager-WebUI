const Badge = ({ children, className = '', ...rest }) => {
  return (
    <span className={`px-2 py-1 text-base rounded-3xl text-gray-200 font-medium ${className}`} {...rest}>
      {children}
    </span>
  )
}

export default Badge
