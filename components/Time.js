import { format, formatDistance, formatDuration, formatISODuration, fromUnixTime, intervalToDuration } from 'date-fns'
import { fromNow } from '../utils'
import { formatDistanceLocale } from '../utils/format-distance'

export function TimeFromNow ({ timestamp }) {
  const formatted = format(fromUnixTime(timestamp), 'd MMM yyyy, H:mm z')

  return (
    <time
      dateTime={fromUnixTime(timestamp).toISOString()}
      title={formatted}
    >
      {fromNow(timestamp)}
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

export function TimeDuration ({ startTimestamp, endTimestamp }) {
  const duration = intervalToDuration({
    start: fromUnixTime(startTimestamp),
    end: fromUnixTime(endTimestamp)
  })
  const exactFormatted = formatDuration(duration)
  const formatted = formatDistance(fromUnixTime(startTimestamp), fromUnixTime(endTimestamp))

  return (
    <time
      dateTime={formatISODuration(duration)}
      title={exactFormatted}
    >
      {formatted}
    </time>
  )
}

export function TimeDurationAbbreviated ({ startTimestamp, endTimestamp }) {
  const duration = intervalToDuration({
    start: fromUnixTime(startTimestamp),
    end: fromUnixTime(endTimestamp)
  })
  const exactFormatted = formatDuration(duration)
  const formatted = formatDistance(fromUnixTime(startTimestamp), fromUnixTime(endTimestamp), { locale: { formatDistance: formatDistanceLocale } })

  return (
    <time
      dateTime={formatISODuration(duration)}
      title={exactFormatted}
    >
      {formatted}
    </time>
  )
}
