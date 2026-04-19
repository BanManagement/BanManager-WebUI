import { useTranslations } from 'next-intl'
import RadialProgressBar from '../RadialProgressBar'

export default function AppealStepHeader ({ step, title, nextStep }) {
  const t = useTranslations('components.appealStep')

  return (
    <div className='flex items-center gap-4 border-b border-accent-400 mb-4'>
      <RadialProgressBar size={24} radius={30} progress={(100 / 3) * step} title={t('progress', { step, total: 3 })} />
      <div>
        <p className='text-2xl font-bold'>{title}</p>
        <p className='text-sm'>{t('next', { next: nextStep })}</p>
      </div>
    </div>
  )
}
