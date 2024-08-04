const PageHeader = ({ title, subTitle, containerClassName = '', className = '', children, ...rest }) => {
  return (
    <>
      {subTitle && <h2 className='text-xs text-center tracking-widest title-font mb-5 font-medium uppercase text-gray-300'>{subTitle}</h2>}
      <div className={`flex flex-col md:flex-row justify-center items-center pb-4 mb-4 border-b border-accent-400 ${containerClassName}`}>
        <h1 className={`text-3xl font-bold leading-none pb-4 md:pb-0 ${className}`} {...rest}>{title}</h1>
        {children}
      </div>
    </>
  )
}

export default PageHeader
