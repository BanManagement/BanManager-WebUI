import ActivityBadge from '../admin/servers/ActivityBadge'
import Avatar from '../Avatar'
import Link from 'next/link'
import { BiServer } from 'react-icons/bi'
import { formatTimestamp } from '../../utils'
import Button from '../Button'
import AnimatedDisclosure from '../AnimatedDisclosure' // Adjust the import path as necessary

export default function AppealPunishment ({ punishment, appealable, open }) {
  const buttonContent = (
    <div className='w-full flex flex-row items-center gap-4'>
      <Avatar uuid={punishment.actor.id} height='54' width='54' />
      <div className='flex flex-col text-left'>
        <span>{punishment.actor.name}</span>
        <span className='text-sm text-gray-400'>{formatTimestamp(punishment.created)}</span>
        <div className='text-sm text-gray-400 flex items-center gap-1'>
          <BiServer />
          <span className='truncate'>{punishment.server.name}</span>
        </div>
      </div>
      <div className='flex-grow text-right'>
        <ActivityBadge type={punishment.type.toUpperCase()} />
      </div>
    </div>
  )

  const panelContent = (
    <div className='mt-4'>
      <p>{punishment.reason}</p>
      {appealable && (
        <Link href={`/appeal/punishment/${punishment.server.id}/${punishment.type}/${punishment.id}/`} passHref>
          <Button className='mt-4'>
            Appeal
          </Button>
        </Link>
      )}
    </div>
  )

  return (
    <AnimatedDisclosure containerClassName='w-full max-w-md bg-primary-900 rounded-3xl p-4 mb-2' buttonContent={buttonContent} defaultOpen={open}>
      {panelContent}
    </AnimatedDisclosure>
  )
}
