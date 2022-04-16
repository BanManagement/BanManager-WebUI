import Badge from '../Badge'

export default function PlayerAppealBadge ({ appeal }) {
  switch (appeal.punishmentType) {
    case 'PlayerBan':
      return <Badge className='bg-red-500 sm:mx-auto'>Ban</Badge>

    case 'PlayerMute':
      return <Badge className='bg-indigo-500 sm:mx-auto'>Mute</Badge>

    case 'PlayerWarning':
      return <Badge className='bg-amber-500 sm:mx-auto'>Warning</Badge>
  }

  return null
}
