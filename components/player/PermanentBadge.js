import { FaInfinity } from 'react-icons/fa'
import Badge from '../Badge'

export default function PermanentBadge () {
  return (
    <Badge className='bg-red-800 py-0 px-1 flex' title='Permanent'><FaInfinity /></Badge>
  )
}
