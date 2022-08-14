import { format, fromUnixTime } from 'date-fns'
import { fromNow, useToggle } from '../utils'

export function TimeFromNow ({ timestamp }) {
  const [showISO, toggleShowISO] = useToggle()
  const formatted = format(fromUnixTime(timestamp), 'd MMM yyyy, H:mm z')

  return (
    <time
      dateTime={fromUnixTime(timestamp).toISOString()}
      title={formatted}
      onClick={toggleShowISO}
    >
      {showISO
        ? formatted
        : fromNow(timestamp)}
    </time>
  )
}

export function Time ({ timestamp }) {
  const formatted = format(fromUnixTime(timestamp), 'd MMM yyyy, H:mm z')

  return (
    <time
      dateTime={fromUnixTime(timestamp).toISOString()}
      title={formatted}
    >
      {formatted}
    </time>
  )
}
