import { TimeFromNow } from '../Time'

export default function PlayerLastSeen ({ lastSeen }) {
  return (
    <h2 className='text-xs tracking-widest title-font text-center font-medium text-gray-400 uppercase'><TimeFromNow timestamp={lastSeen} /></h2>
  )
}
