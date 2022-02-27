import clsx from 'clsx'

export const Step = ({ isActiveStep, label, icon }) => {
  return (
    <a className={clsx('sm:px-6 py-3 w-1/2 sm:w-auto justify-center sm:justify-start border-b-2 title-font font-medium inline-flex items-center leading-none tracking-wider',
      {
        'bg-black border-accent-500 rounded-t': isActiveStep,
        'border-gray-800 hover:bg-gray-800 hover:border-accent-500 cursor-pointer': !isActiveStep
      })}
    >
      {icon}{label}
    </a>
  )
}
