import { useRouter } from 'next/router'
import Link from 'next/link'
import { format, fromUnixTime } from 'date-fns'
import { Disclosure } from '@headlessui/react'
import { BsChevronUp, BsChevronDown } from 'react-icons/bs'
import { useApi, useUser } from '../../../utils'
import Loader from '../../../components/Loader'
import Table from '../../../components/Table'
import DefaultLayout from '../../../components/DefaultLayout'
import ErrorLayout from '../../../components/ErrorLayout'
import PageContainer from '../../../components/PageContainer'
import PageHeader from '../../../components/PageHeader'
import PlayerReportCommentList from '../../../components/reports/PlayerReportCommentList'
import PlayerReportAssign from '../../../components/reports/PlayerReportAssign'
import PlayerReportState from '../../../components/reports/PlayerReportState'
import PlayerReportLocation from '../../../components/reports/PlayerReportLocation'
import PlayerReportActions from '../../../components/reports/PlayerReportActions'
import PlayerReportCommand from '../../../components/reports/PlayerReportCommand'
import PlayerReportNotifications from '../../../components/reports/PlayerReportNotifications'

export default function Page () {
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
      }
    }`
  })

  const report = data?.report

  if (loading) return <DefaultLayout title='Loading...'><Loader /></DefaultLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const stateOptions = data.reportStates.map(state => ({ value: state.id, label: state.name }))
  const canComment = report.state.id < 3 && report.acl.comment
  const canUpdateState = report.acl.state
  const canAssign = report.acl.assign

  return (
    <DefaultLayout title={`#${id} Report`}>
      <PageContainer>
        <div className='pb-6'>
          <h1
            className='text-2xl font-bold break-words pb-2'
          >
            <span className='mr-3'>{report.reason}</span>
            <span className='block md:inline text-gray-400'>#{report.id}</span>
          </h1>
          <p className='pb-4 border-b border-accent-200 text-gray-400'>
            <Link href={`/player/${report.actor.id}`}>
              <a>
                {report.actor.name}
              </a>
            </Link> reported&nbsp;
            <Link href={`/player/${report.player.id}`}>
              <a>
                {report.player.name}
              </a>
            </Link>
            &nbsp;on {format(fromUnixTime(report.created), 'dd MMM yyyy')}
          </p>
        </div>
        <div className='grid grid-flow-row md:grid-flow-col grid-cols-12'>
          <div className='col-span-12 md:col-span-9 space-y-6'>
            <div>
              <PlayerReportCommentList report={id} serverId={serverId} showReply={canComment} />
            </div>
            <div>
              {!!report.serverLogs && !!report.serverLogs.length &&
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className='flex justify-between w-full text-left'>
                        <PageHeader title='Server Logs' className='w-full' />
                        {open ? <BsChevronDown /> : <BsChevronUp />}
                      </Disclosure.Button>
                      <Disclosure.Panel>
                        <Table>
                          <Table.Body>
                            {report.serverLogs.map(({ id, log }) => (
                              <Table.Row key={id} className='text-xs'>
                                <Table.Cell className='hidden md:table-cell pl-5 pr-3 whitespace-no-wrap'>
                                  <div>{format(fromUnixTime(log.created), 'dd MMM yyyy HH:mm:ss')}</div>
                                </Table.Cell>
                                <Table.Cell className='px-2 py-2 whitespace-no-wrap'>
                                  <div className='md:hidden'>{format(fromUnixTime(log.created), 'dd MMM yyyy HH:mm:ss')}</div>
                                  <div>{log.message}</div>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>}
            </div>
          </div>
          <div className='hidden md:block col-span-3 space-y-6 mx-6'>
            <div className='sticky top-6'>
              <ul role='list' className='divide-y divide-gray-700'>
                <li className='pb-3'>
                  <div className='flex items-center'>
                    <div className='flex-1 min-w-0 space-y-3'>
                      <p>
                        State
                      </p>
                      {canUpdateState
                        ? (
                          <PlayerReportState
                            id={report.id}
                            server={data.server.id}
                            currentState={report?.state}
                            states={stateOptions}
                            onChange={({ reportState: { state, updated } }) => {
                              mutate({ ...data, report: { ...data.report, state, updated } }, false)
                            }}
                          />)
                        : (<p className='text-sm text-gray-400'>{report?.state?.name}</p>)}
                    </div>
                  </div>
                </li>
                <li className='py-3 sm:py-4'>
                  <div className='flex items-center space-x-4'>
                    <div className='flex-1 min-w-0 space-y-3'>
                      <p>
                        Assignee
                      </p>
                      {canAssign
                        ? (
                          <PlayerReportAssign
                            id={report.id}
                            player={report.assignee}
                            server={data.server.id}
                            onChange={({ assignReport: { assignee, updated } }) => {
                              mutate({ ...data, report: { ...data.report, assignee, updated } }, false)
                            }}
                          />)
                        : (<p className='text-sm text-gray-400'>{report?.assignee?.name || 'No one'}</p>)}
                    </div>
                  </div>
                </li>
                {!!user &&
                  <li className='py-3 sm:py-4'>
                    <div className='flex items-center space-x-4'>
                      <div className='flex-1 min-w-0 space-y-3'>
                        <p>
                          Notifications
                        </p>
                        <PlayerReportNotifications
                          report={report}
                          server={data.server}
                          onChange={({ reportSubscriptionState }) => {
                            mutate({ ...data, report: { ...data.report, viewerSubscription: reportSubscriptionState } }, false)
                          }}
                        />
                      </div>
                    </div>
                  </li>}
              </ul>
              <PageHeader title='Locations' />
              <ul role='list' className='divide-y divide-gray-700'>
                {report.playerLocation && <PlayerReportLocation location={report.playerLocation} player={report.player} />}
                {report.actorLocation && <PlayerReportLocation location={report.actorLocation} player={report.actor} />}
              </ul>
              {report?.commands?.length || (!!user && report.state.id < 3) ? <PageHeader title='Actions' /> : <></>}
              {!!user && report.state.id < 3 && !report?.commands?.length &&
                <PlayerReportActions
                  report={report} server={data.server} onAction={({ state, updated, commands }) => {
                    mutate({ ...data, report: { ...data.report, state, updated, commands } }, false)
                  }}
                />}
              {!!report?.commands?.length &&
                <ul role='list' className='divide-y divide-gray-700'>
                  {report.commands.map(cmd => (
                    <PlayerReportCommand key={cmd.id} command={cmd} />
                  ))}
                </ul>}
            </div>
          </div>
        </div>
        <div className='md:hidden col-span-12 space-y-6'>
          <ul role='list' className='divide-y divide-gray-700'>
            <li className='py-3'>
              <div className='flex items-center'>
                <div className='flex-1 min-w-0 space-y-3'>
                  <p>
                    State
                  </p>
                  {canUpdateState
                    ? (
                      <PlayerReportState
                        id={report.id}
                        server={data.server.id}
                        currentState={report?.state}
                        states={stateOptions}
                        onChange={({ reportState: { state, updated } }) => {
                          mutate({ ...data, report: { ...data.report, state, updated } }, false)
                        }}
                      />)
                    : (<p className='text-sm text-gray-400'>{report?.state?.name}</p>)}
                </div>
              </div>
            </li>
            <li className='py-3 sm:py-4'>
              <div className='flex items-center space-x-4'>
                <div className='flex-1 min-w-0 space-y-3'>
                  <p>
                    Assignee
                  </p>
                  {canAssign
                    ? (
                      <PlayerReportAssign
                        id={report.id}
                        player={report.assignee}
                        server={data.server.id}
                        onChange={({ assignReport: { assignee, updated } }) => {
                          mutate({ ...data, report: { ...data.report, assignee, updated } }, false)
                        }}
                      />)
                    : (<p className='text-sm text-gray-400'>{report?.assignee?.name || 'No one'}</p>)}
                </div>
              </div>
            </li>
            {!!user &&
              <li className='py-3 sm:py-4'>
                <div className='flex items-center space-x-4'>
                  <div className='flex-1 min-w-0 space-y-3'>
                    <p>
                      Notifications
                    </p>
                    <PlayerReportNotifications
                      report={report}
                      server={data.server}
                      onChange={({ reportSubscriptionState }) => {
                        mutate({ ...data, report: { ...data.report, viewerSubscription: reportSubscriptionState } }, false)
                      }}
                    />
                  </div>
                </div>
              </li>}
          </ul>
          <div>
            <PageHeader title='Locations' />
            <ul role='list' className='divide-y divide-gray-700'>
              {report.playerLocation && <PlayerReportLocation location={report.playerLocation} player={report.player} />}
              {report.actorLocation && <PlayerReportLocation location={report.actorLocation} player={report.actor} />}
            </ul>
          </div>
          <div>
            {report?.commands?.length || (!!user && report.state.id < 3) ? <PageHeader title='Actions' /> : <></>}
            {!!user && report.state.id < 3 && !report?.commands?.length &&
              <PlayerReportActions
                report={report} server={data.server} onAction={({ state, updated, commands }) => {
                  mutate({ ...data, report: { ...data.report, state, updated, commands } }, false)
                }}
              />}
            {!!report?.commands?.length &&
              <ul role='list' className='divide-y divide-gray-700'>
                {report.commands.map(cmd => (
                  <PlayerReportCommand key={cmd.id} command={cmd} />
                ))}
              </ul>}
          </div>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
