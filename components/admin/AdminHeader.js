const PageHeader = ({ children, title, className = '', ...rest }) => {
  return (
    <div className='pb-4 mb-4 flex justify-between items-center border-b border-accent-200'>
      <h1 className={`text-2xl font-bold leading-none ${className}`}>{title}</h1>
      {children}
    </div>
  )
}

export default PageHeader
