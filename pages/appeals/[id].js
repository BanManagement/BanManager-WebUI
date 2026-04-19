import { useRouter } from 'next/router'
import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'
import DefaultLayout from '../../components/DefaultLayout'
import ErrorLayout from '../../components/ErrorLayout'
import PageContainer from '../../components/PageContainer'
import PlayerAppealBadge from '../../components/appeals/PlayerAppealBadge'
import PlayerAppealCommentList from '../../components/appeals/PlayerAppealCommentList'
import { fromNow, useApi, useUser } from '../../utils'
import { LOCALE_CONFIG, DEFAULT_LOCALE } from '../../utils/locale'
import { useDateFnsLocale } from '../../utils/format-distance'
import PlayerAppealSidebar from '../../components/appeals/PlayerAppealSidebar'

export default function Page () {
  const t = useTranslations()
  const locale = useLocale()
  const dateFnsLocale = useDateFnsLocale()
  const { user } = useUser()
  const router = useRouter()
  const { id } = router.query
  const { loading, data, errors, mutate } = useApi({
    variables: { id },
    query: !id
      ? null
      : `query appeal($id: ID!) {
      appealStates {
        id
        name
      }
      appeal(id: $id) {
        id
        actor {
          id
          name
        }
        assignee {
          id
          name
        }
        punishmentActor {
          id
          name
        }
        punishmentType
        punishmentReason
        punishmentCreated
        punishmentExpires
        punishmentSoft
        punishmentPoints
        reason
        created
        updated
        state {
          id
          name
        }
        server {
          id
          name
        }
        acl {
          state
          assign
          comment
          delete
        }
        viewerSubscription {
          state
        }
        documents {
          id
        }
        initialDocuments {
          id
          filename
          mimeType
          acl {
            delete
          }
        }
      }
    }`
  })
  const appeal = data?.appeal

  if (loading) return <DefaultLayout title={t('common.loading')} loading />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const stateOptions = data.appealStates.map(state => ({ value: state.id, label: state.name }))
  const canComment = appeal.state.id < 3 && appeal.acl.comment
  const canUpdateState = appeal.acl.state
  const canAssign = appeal.acl.assign
  const dateFormat = LOCALE_CONFIG[locale]?.dateFormat || LOCALE_CONFIG[DEFAULT_LOCALE].dateFormat
  const formatDate = (timestamp) => {
    try {
      return format(fromUnixTime(timestamp), dateFormat, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
    } catch {
      return format(fromUnixTime(timestamp), dateFormat)
    }
  }
  const punishmentKind = appeal.punishmentExpires === 0 ? 'permanent' : 'temporary'

  return (
    <DefaultLayout title={t('pages.appeals.documentTitle', { id, name: appeal.actor.name, reason: appeal.punishmentReason })}>
      <PageContainer>
        <div className='pb-6'>
          <h1
            className='text-2xl font-bold break-words pb-2'
          >
            <span className='mr-3'>{appeal.punishmentReason}</span>
            <span className='block md:inline text-gray-400'>#{appeal.id}</span>
            <span className='block md:inline text-gray-400'> {formatDate(appeal.created)}</span>
          </h1>
          <p className='pb-4 border-b border-accent-400 text-gray-400'>
            {t.rich('pages.appeals.appealingSentence', {
              actorName: appeal.actor.name,
              punisherName: appeal.punishmentActor.name,
              kind: punishmentKind,
              issuedDate: formatDate(appeal.punishmentCreated),
              expiresTime: appeal.punishmentExpires === 0 ? '' : fromNow(appeal.punishmentExpires),
              actor: (chunks) => <Link href={`/player/${appeal.actor.id}`}>{chunks}</Link>,
              punisher: (chunks) => <Link href={`/player/${appeal.punishmentActor.id}`}>{chunks}</Link>,
              badge: () => <PlayerAppealBadge appeal={appeal} />
            })}
          </p>
        </div>
        <div className='grid grid-flow-row md:grid-flow-col grid-cols-12'>
          <div className='col-span-12 md:col-span-9'>
            <div>
              <PlayerAppealCommentList appeal={appeal} showReply={canComment} />
            </div>
          </div>
          <div className='hidden md:block col-span-3 space-y-6 mx-6'>
            <div className='sticky top-6'>
              <PlayerAppealSidebar
                data={data}
                canUpdateState={canUpdateState}
                canAssign={canAssign}
                stateOptions={stateOptions}
                mutate={mutate}
                user={user}
              />
            </div>
          </div>
        </div>
        <div className='md:hidden col-span-12 space-y-6'>
          <PlayerAppealSidebar
            data={data}
            canUpdateState={canUpdateState}
            canAssign={canAssign}
            stateOptions={stateOptions}
            mutate={mutate}
            user={user}
          />
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
