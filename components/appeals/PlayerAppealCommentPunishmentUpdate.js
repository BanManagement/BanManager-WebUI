import Link from 'next/link'
import { GoIssueClosed, GoPencil, GoEyeClosed, GoEye, GoClock } from 'react-icons/go'
import { format, fromUnixTime } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'
import Avatar from '../Avatar'
import { fromNow } from '../../utils'
import { LOCALE_CONFIG, DEFAULT_LOCALE } from '../../utils/locale'
import { useDateFnsLocale } from '../../utils/format-distance'

export default function PlayerAppealCommentPunishmentUpdate ({ id, actor, created, state, oldReason, newReason, oldExpires, newExpires, oldSoft, newSoft }) {
  const t = useTranslations('pages.appeals.updates')
  const locale = useLocale()
  const dateFnsLocale = useDateFnsLocale()
  const dateFormat = `${LOCALE_CONFIG[locale]?.dateFormat || LOCALE_CONFIG[DEFAULT_LOCALE].dateFormat} HH:mm:ss`

  const expiryFormat = (expiry) => {
    if (expiry === 0) return t('permanent')

    try {
      return format(fromUnixTime(expiry), dateFormat, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
    } catch {
      return format(fromUnixTime(expiry), dateFormat)
    }
  }

  const softLabel = (soft) => soft ? t('shadow') : t('notShadow')

  const richTags = {
    actor: (chunks) => <Link href={`/player/${actor.id}`}>{chunks}</Link>,
    old: (chunks) => <span className='font-bold line-through'>{chunks}</span>,
    new: (chunks) => <span className='font-bold'>{chunks}</span>
  }

  const messages = []

  if (oldReason && newReason) {
    messages.push({
      message: t.rich('reasonChanged', {
        ...richTags,
        actorName: actor.name,
        oldReason,
        newReason
      })
    })
  }

  if (typeof oldExpires === 'number' && typeof newExpires === 'number') {
    messages.push({
      icon: <GoClock className='w-6 h-6 inline-block' />,
      message: t.rich('expirationChanged', {
        ...richTags,
        actorName: actor.name,
        oldExpires: expiryFormat(oldExpires),
        newExpires: expiryFormat(newExpires)
      })
    })
  }

  if (typeof oldSoft === 'boolean' && typeof newSoft === 'boolean') {
    messages.push({
      icon: newSoft ? <GoEyeClosed className='w-6 h-6 inline-block' /> : <GoEye className='w-6 h-6 inline-block' />,
      message: t.rich('softChanged', {
        ...richTags,
        actorName: actor.name,
        oldSoft: softLabel(oldSoft),
        newSoft: softLabel(newSoft)
      })
    })
  }

  return (
    <>
      {messages
        .map(({ message, icon }, i) => (
          <div className='ml-4 pt-3 pb-3 pl-4 relative' key={`comment-${id}-${i}`} id={`comment-${id}-${i}`}>
            <span className='flex w-8 h-8 items-center justify-center rounded-full bg-primary-900 text-gray-300 float-left -ml-8 mr-2'>
              {icon || <GoPencil className='w-6 h-6 inline-block' />}
            </span>
            <Link
              href={`/player/${actor.id}`}
              className='align-middle mx-1 inline-flex relative'
            >

              <Avatar uuid={actor.id} width={20} height={20} />

            </Link>
            <span className='pl-1 text-sm text-gray-300'>{message}</span>
          </div>
        ))}
      <div className='ml-4 pt-3 pb-3 pl-4 relative' id={`comment-${id}`}>
        <span className='flex w-8 h-8 items-center justify-center rounded-full bg-primary-900 text-gray-300 float-left -ml-8 mr-2'>
          <GoIssueClosed className='w-6 h-6 inline-block' />
        </span>
        <Link
          href={`/player/${actor.id}`}
          className='align-middle mx-1 inline-flex relative'
        >

          <Avatar uuid={actor.id} width={20} height={20} />

        </Link>
        <span className='pl-1 text-sm text-gray-300'>
          {t.rich('stateMarked', {
            ...richTags,
            actorName: actor.name,
            state: state.name.toLowerCase(),
            time: fromNow(created)
          })}
        </span>
      </div>
    </>
  )
}
