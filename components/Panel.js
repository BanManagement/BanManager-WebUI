import clsx from 'clsx'

const Panel = ({ className = '', children }) => (
  <div className={clsx(`h-full p-6 flex flex-col relative rounded-3xl border-primary-900 border-2 ${className}`)}>
    {children}
  </div>
)

export default Panel
