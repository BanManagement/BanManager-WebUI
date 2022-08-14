import Badge from '../../Badge'

export default function ActivityBadge ({ type }) {
  switch (type) {
    case 'BAN':
    case 'IPBAN':
    case 'IPRANGEBAN':
      return <Badge className='bg-red-500 sm:mx-auto'>Ban</Badge>

    case 'MUTE':
    case 'IPMUTE':
      return <Badge className='bg-indigo-500 sm:mx-auto'>Mute</Badge>

    case 'NOTE':
      return <Badge className='bg-teal-500 sm:mx-auto'>Note</Badge>

    case 'WARNING':
      return <Badge className='bg-amber-500 sm:mx-auto'>Warning</Badge>

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
