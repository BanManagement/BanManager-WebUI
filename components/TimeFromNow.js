import { format, fromUnixTime } from 'date-fns'
import { fromNow } from '../utils'

export default function TimeFromNow ({ timestamp }) {
  return (
    <time
      dateTime={new Date(timestamp).toISOString()}
      title={format(fromUnixTime(timestamp), 'd MMM yyyy, H:mm z')}
    >
      {fromNow(timestamp)}
    </time>
  )
}
