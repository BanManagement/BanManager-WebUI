import { format, formatDistance, formatDistanceStrict, formatDuration, formatISODuration, fromUnixTime, intervalToDuration } from 'date-fns'
import { formatDistanceLocale, useDateFnsLocale } from '../utils/format-distance'

const safeFormat = (date, pattern, locale) => {
  try {
    return format(date, pattern, locale ? { locale } : undefined)
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[i18n] date-fns format failed, falling back to default locale:', { pattern, localeCode: locale?.code, error: e?.message })
    }

    return format(date, pattern)
  }
}

export function TimeFromNow ({ timestamp }) {
  const dateFnsLocale = useDateFnsLocale()
  const date = fromUnixTime(timestamp)
  const formatted = safeFormat(date, 'd MMM yyyy, H:mm z', dateFnsLocale)

  let relative

  try {
    relative = formatDistanceStrict(date, new Date(), { addSuffix: true, locale: dateFnsLocale || undefined })
  } catch (e) {
    relative = timestamp
  }

  return (
    <time
      dateTime={date.toISOString()}
      title={formatted}
    >
      {relative}
    </time>
  )
}

export function Time ({ timestamp }) {
  const dateFnsLocale = useDateFnsLocale()
  const formatted = safeFormat(fromUnixTime(timestamp), 'd MMM yyyy, H:mm z', dateFnsLocale)

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
  const dateFnsLocale = useDateFnsLocale()
  const duration = intervalToDuration({
    start: fromUnixTime(startTimestamp),
    end: fromUnixTime(endTimestamp)
  })
  const exactFormatted = formatDuration(duration, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
  const formatted = formatDistance(fromUnixTime(startTimestamp), fromUnixTime(endTimestamp), dateFnsLocale ? { locale: dateFnsLocale } : undefined)

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
  const dateFnsLocale = useDateFnsLocale()
  const duration = intervalToDuration({
    start: fromUnixTime(startTimestamp),
    end: fromUnixTime(endTimestamp)
  })
  const exactFormatted = formatDuration(duration, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
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
