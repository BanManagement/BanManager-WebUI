export default function EmptyState ({ title, subTitle, children }) {
  return (
    <div className='relative bg-black p-8 text-center border border-gray-200 rounded-lg border-dashed'>
      <h2 className='text-2xl font-medium'>
        {title}
      </h2>
      <p className='mt-4 text-sm text-gray-500'>
        {subTitle}
      </p>
      <div className='mt-8'>
        {children}
      </div>
    </div>
  )
}
