import PlayerReportActions from './PlayerReportActions'
import PlayerReportAssign from './PlayerReportAssign'
import PlayerReportCommand from './PlayerReportCommand'
import PlayerReportLocation from './PlayerReportLocation'
import PlayerReportNotifications from './PlayerReportNotifications'
import PlayerReportServerLogs from './PlayerReportServerLogs'
import PlayerReportState from './PlayerReportState'

const SidebarItem = ({ title, children }) => (
  <li className='py-3 sm:py-4'>
    <div className='flex items-center space-x-4'>
      <div className='flex-1 min-w-0 space-y-3'>
        <p className='text-gray-400'>
          {title}
        </p>
        {children}
      </div>
    </div>
  </li>
)

export default function PlayerReportSidebar ({ data, canUpdateState, canAssign, stateOptions, mutate, user }) {
  const report = data?.report

  return (
    <ul role='list' className='divide-y divide-primary-900'>
      <SidebarItem title='State'>
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
          : (<p className='text-sm'>{report?.state?.name}</p>)}
      </SidebarItem>
      <SidebarItem title='Assignee'>
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
          : (<p className='text-sm'>{report?.assignee?.name || 'Unassigned'}</p>)}
      </SidebarItem>
      {!!user &&
        <SidebarItem title='Notifications'>
          <PlayerReportNotifications
            report={report}
            server={data.server}
            onChange={({ reportSubscriptionState }) => {
              mutate({ ...data, report: { ...data.report, viewerSubscription: reportSubscriptionState } }, false)
            }}
          />
        </SidebarItem>}
      {(report.playerLocation || report.actorLocation) &&
        <SidebarItem title='Locations'>
          <ul className='space-y-4'>
            {report.playerLocation && <PlayerReportLocation location={report.playerLocation} player={report.player} />}
            {report.actorLocation && <PlayerReportLocation location={report.actorLocation} player={report.actor} />}
          </ul>
        </SidebarItem>}
      {report.serverLogs && !!report.serverLogs.length &&
        <SidebarItem title='Server Logs'>
          <PlayerReportServerLogs serverLogs={report.serverLogs} />
        </SidebarItem>}
      {((!!user && report.state.id < 3 && !report?.commands?.length) || !!report?.commands?.length) &&
        <SidebarItem title='Actions'>
          {!!report?.commands?.length &&
            <ul role='list' className='divide-y divide-primary-900'>
              {report.commands.map(cmd => (
                <PlayerReportCommand key={cmd.id} command={cmd} />
              ))}
            </ul>}
          {!!user && report.state.id < 3 && !report?.commands?.length &&
            <PlayerReportActions
              report={report} server={data.server} onAction={({ state, updated, commands }) => {
                mutate({ ...data, report: { ...data.report, state, updated, commands } }, false)
              }}
            />}
        </SidebarItem>}
    </ul>
  )
}
