import clsx from 'clsx'
import Badge from '../../Badge'

export default function ActivityBadge ({ type, temporary }) {
  switch (type) {
    case 'BAN':
    case 'IPBAN':
    case 'IPRANGEBAN':
      return <Badge className={clsx('sm:mx-auto', { 'bg-red-500': !!temporary, 'bg-red-800': !temporary })}>Ban</Badge>

    case 'MUTE':
    case 'IPMUTE':
      return <Badge className={clsx('sm:mx-auto', { 'bg-indigo-500': !!temporary, 'bg-indigo-800': !temporary })}>Mute</Badge>

    case 'NOTE':
      return <Badge className='bg-teal-500 sm:mx-auto'>Note</Badge>

    case 'WARNING':
      return <Badge className={clsx('sm:mx-auto', { 'bg-amber-500': !!temporary, 'bg-amber-800': !temporary })}>Warning</Badge>

    case 'UNBAN':
    case 'IPUNBAN':
    case 'IPRANGEUNBAN':
      return <Badge className='bg-green-500 sm:mx-auto'>Unbanned</Badge>
    case 'UNMUTE':
    case 'IPUNMUTE':
      return <Badge className='bg-green-500 sm:mx-auto'>Unmuted</Badge>
  }

  return type
}
