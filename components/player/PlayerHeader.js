export default function PlayerHeader ({ title, subTitle }) {
  return (
    <div className='flex flex-col justify-start justify-items-stretch w-full py-6 border-t border-primary-900'>
      <h1 className='text-xl font-bold pb-2 leading-none text-center'>{title}</h1>
      {subTitle && <h2 className='text-xs tracking-widest title-font text-center font-medium text-gray-400 uppercase'>{subTitle}</h2>}
    </div>
  )
}
