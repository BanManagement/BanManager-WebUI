const Button = ({ children, disabled, loading, className = '', ...rest }) => {
  return (
    <button className={`py-4 px-6 inline-flex justify-center rounded-full items-center bg-accent-600 hover:bg-accent-700 focus:ring-accent-700 focus:ring-offset-accent-200 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`} disabled={disabled} {...rest}>
      {loading && <div className='loader -ml-1 mr-3 h-5 w-5' />}
      {children}
    </button>
  )
}

export default Button
