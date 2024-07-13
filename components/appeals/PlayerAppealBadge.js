import clsx from 'clsx'
import Badge from '../Badge'

export default function PlayerAppealBadge ({ appeal, children, className }) {
  switch (appeal.punishmentType) {
    case 'PlayerBan':
      return <Badge className={clsx('bg-red-800', className)}>{children || 'Ban'}</Badge>

    case 'PlayerMute':
      return <Badge className={clsx('bg-indigo-800', className)}>{children || 'Mute'}</Badge>

    case 'PlayerWarning':
      return <Badge className={clsx('bg-amber-800', className)}>{children || 'Warning'}</Badge>
  }

  return <Badge className={clsx('bg-fuchsia-800', className)}>{children || 'Unknown'}</Badge>
}
