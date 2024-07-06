import RadialProgressBar from '../RadialProgressBar'

export default function AppealStepHeader ({ step, title, nextStep }) {
  return (
    <div className='flex items-center gap-4 border-b border-accent-400 mb-4'>
      <RadialProgressBar size={24} radius={30} progress={(100 / 3) * step} title={`${step} of 3`} />
      <div>
        <p className='text-2xl font-bold'>{title}</p>
        <p className='text-sm'>Next: {nextStep}</p>
      </div>
    </div>
  )
}
