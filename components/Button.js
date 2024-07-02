import { forwardRef } from 'react'

// eslint-disable-next-line react/display-name
const Button = forwardRef(({ children, disabled, loading, className = '', ...rest }, ref) => {
  return (
    <button ref={ref} className={`py-4 px-6 inline-flex justify-center rounded-3xl items-center bg-accent-700 hover:bg-accent-600 focus:ring-accent-600 text-white w-full transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-1 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed ${className}`} disabled={disabled} {...rest}>
      {loading && <div className='loader -ml-1 mr-3 h-5 w-5' />}
      {children}
    </button>
  )
})

export default Button
