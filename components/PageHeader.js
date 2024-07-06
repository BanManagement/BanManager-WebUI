const PageHeader = ({ title, subTitle, className = '', ...rest }) => {
  return (
    <>
      {subTitle && <h2 className='text-xs text-center tracking-widest title-font mb-5 font-medium uppercase text-gray-300'>{subTitle}</h2>}
      <h1 className={`text-3xl text-center font-bold pb-4 mb-4 border-b border-accent-400 leading-none ${className}`} {...rest}>{title}</h1>
    </>
  )
}

export default PageHeader
