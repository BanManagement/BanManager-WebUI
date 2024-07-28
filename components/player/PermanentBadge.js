import { FaInfinity } from 'react-icons/fa'
import Badge from '../Badge'

export default function PermanentBadge ({ className = '' }) {
  return (
    <Badge className={`bg-red-800 py-0 px-1 flex ${className}`} title='Permanent'><FaInfinity /></Badge>
  )
}
