import { useRouter } from 'next/router'
import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import { useLocale, useTranslations } from 'next-intl'
import { useApi, useUser } from '../../../utils'
import { LOCALE_CONFIG, DEFAULT_LOCALE } from '../../../utils/locale'
import { useDateFnsLocale } from '../../../utils/format-distance'
import DefaultLayout from '../../../components/DefaultLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import PageContainer from '../../../components/PageContainer'
import PlayerReportCommentList from '../../../components/reports/PlayerReportCommentList'
import PlayerReportServerLogs from '../../../components/reports/PlayerReportServerLogs'
import PlayerReportSidebar from '../../../components/reports/PlayerReportSidebar'

export default function Page () {
  const t = useTranslations()
  const locale = useLocale()
  const dateFnsLocale = useDateFnsLocale()
  const { user } = useUser()
  const router = useRouter()
  const { id, serverId } = router.query
  const { loading, data, errors, mutate } = useApi({
    variables: { serverId, id },
    query: !serverId && !id
      ? null
      : `query report($id: ID!, $serverId: ID!) {
      reportStates(serverId: $serverId) {
        id
        name
      }
      server(id: $serverId) {
        id
        name
      }
      report(id: $id, serverId: $serverId) {
        id
        player {
          id
          name
        }
        actor {
          id
          name
        }
        assignee {
          id
          name
        }
        reason
        created
        updated
        state {
          id
          name
        }
        playerLocation {
          world
          x
          y
          z
          yaw
          pitch
        }
        actorLocation {
          world
          x
          y
          z
          yaw
          pitch
        }
        acl {
          state
          assign
          comment
          delete
        }
        serverLogs {
          id
          log {
            message
            created
          }
        }
        commands {
          id
          command
          args
          created
          actor {
            id
            name
          }
        }
        viewerSubscription {
          state
        }
        documents {
          id
        }
      }
    }`
  })

  const report = data?.report

  if (loading) return <DefaultLayout title={t('common.loading')} loading />
  if (errors || !data) return <ErrorLayout errors={errors} />

  const stateOptions = data.reportStates.map(state => ({ value: state.id, label: state.name }))
  const canComment = report.state.id < 3 && report.acl.comment
  const canUpdateState = report.acl.state
  const canAssign = report.acl.assign
  const dateFormat = LOCALE_CONFIG[locale]?.dateFormat || LOCALE_CONFIG[DEFAULT_LOCALE].dateFormat
  const formattedDate = (() => {
    try {
      return format(fromUnixTime(report.created), dateFormat, dateFnsLocale ? { locale: dateFnsLocale } : undefined)
    } catch {
      return format(fromUnixTime(report.created), dateFormat)
    }
  })()

  return (
    <DefaultLayout title={t('pages.report.documentTitle', { id, name: report.actor.name, reason: report.reason })}>
      <PageContainer>
        <div className='pb-6'>
          <h1
            className='text-2xl font-bold break-words pb-2'
          >
            <span className='mr-3'>{report.reason}</span>
            <span className='block md:inline text-gray-400'>#{report.id}</span>
          </h1>
          <p className='pb-4 border-b border-accent-400 text-gray-400'>
            {t.rich('pages.report.reportedSentence', {
              actorName: report.actor.name,
              playerName: report.player.name,
              date: formattedDate,
              actor: (chunks) => <Link href={`/player/${report.actor.id}`}>{chunks}</Link>,
              player: (chunks) => <Link href={`/player/${report.player.id}`}>{chunks}</Link>
            })}
          </p>
        </div>
        <div className='grid grid-flow-row md:grid-flow-col grid-cols-12'>
          <div className='col-span-12 md:col-span-9 space-y-6'>
            <div>
              <PlayerReportCommentList report={id} serverId={serverId} showReply={canComment} />
            </div>
            <div className='flex'>
              {!!report.serverLogs && !!report.serverLogs.length && <PlayerReportServerLogs report={report} />}
            </div>
          </div>
          <div className='hidden md:block col-span-3 space-y-6 mx-6'>
            <div className='sticky top-6'>
              <PlayerReportSidebar
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
          <PlayerReportSidebar
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
