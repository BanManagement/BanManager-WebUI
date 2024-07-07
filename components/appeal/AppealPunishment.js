import { Disclosure } from '@headlessui/react'
import ActivityBadge from '../admin/servers/ActivityBadge'
import Avatar from '../Avatar'
import Link from 'next/link'
import { BiServer } from 'react-icons/bi'
import { formatTimestamp } from '../../utils'
import Button from '../Button'

export default function AppealPunishment ({ punishment, appealable, open }) {
  return (
    <Disclosure key={punishment.server.id + punishment.id + punishment.type} as='div' className='w-full max-w-md bg-primary-900 rounded-3xl p-4 mb-2' defaultOpen={open}>
      <Disclosure.Button className='w-full flex flex-row items-center gap-4'>
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
      </Disclosure.Button>
      <div className='overflow-hidden'>
        <Disclosure.Panel className='mt-4'>
          <p>{punishment.reason}</p>
          {appealable && (
            <Link href={`/appeal/punishment/${punishment.server.id}/${punishment.type}/${punishment.id}/`} passHref>
              <Button className='mt-4'>
                Appeal
              </Button>
            </Link>
          )}
        </Disclosure.Panel>
      </div>
    </Disclosure>
  )
}
