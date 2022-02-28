const PageHeader = ({ title, subTitle, className = '', ...rest }) => {
  return (
    <>
      {subTitle && <h2 className='text-xs tracking-widest title-font mb-5 font-medium uppercase'>{subTitle}</h2>}
      <h1 className={`text-2xl font-bold pb-4 mb-4 border-b border-accent-200 leading-none ${className}`} {...rest}>{title}</h1>
    </>
  )
}

export default PageHeader
