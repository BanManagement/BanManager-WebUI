import { FaInfinity } from 'react-icons/fa'
import { useTranslations } from 'next-intl'
import Badge from '../Badge'

export default function PermanentBadge ({ className = '' }) {
  const t = useTranslations('common')

  return (
    <Badge className={`bg-red-800 py-0 px-1 flex ${className}`} title={t('permanent')}><FaInfinity /></Badge>
  )
}
