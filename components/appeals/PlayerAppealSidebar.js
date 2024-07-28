import { useMatchMutate } from '../../utils'
import PlayerAppealActions from './PlayerAppealActions'
import PlayerAppealAssign from './PlayerAppealAssign'
import PlayerAppealNotifications from './PlayerAppealNotifications'
import PlayerAppealState from './PlayerAppealState'

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

export default function PlayerAppealSidebar ({ data, canUpdateState, canAssign, stateOptions, mutate, user }) {
  const matchMutate = useMatchMutate()
  const mutateCommentInsert = (comment) => ({ data }, mutate) => {
    const records = data.listPlayerAppealComments.records.slice()

    records.push(comment)
    mutate({ listPlayerAppealComments: { total: data.listPlayerAppealComments.total + 1, records } }, false)
  }
  const appeal = data?.appeal

  return (
    <ul role='list' className='divide-y divide-primary-900'>
      <SidebarItem title='State'>
        {canUpdateState
          ? (
            <PlayerAppealState
              id={appeal.id}
              currentState={appeal?.state}
              states={stateOptions}
              onChange={({ appealState: { appeal: { state, updated }, comment } }) => {
                mutate({ ...data, appeal: { ...data.appeal, state, updated } }, false)
                matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id: appeal?.id })
              }}
            />)
          : (<p className='text-sm'>{appeal?.state?.name}</p>)}
      </SidebarItem>
      <SidebarItem title='Assignee'>
        {canAssign
          ? (
            <PlayerAppealAssign
              id={appeal.id}
              player={appeal.assignee}
              onChange={({ assignAppeal: { appeal: { assignee, updated }, comment } }) => {
                mutate({ ...data, appeal: { ...data.appeal, assignee, updated } }, false)
                matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id: appeal.id })
              }}
            />)
          : (<p className='text-sm'>{appeal?.assignee?.name || 'Unassigned'}</p>)}
      </SidebarItem>
      {!!user &&
        <SidebarItem title='Notifications'>
          <PlayerAppealNotifications
            appeal={appeal}
            onChange={({ appealSubscriptionState }) => {
              mutate({ ...data, appeal: { ...data.appeal, viewerSubscription: appealSubscriptionState } }, false)
            }}
          />
        </SidebarItem>}
      {!!user && appeal.state.id < 3 &&
        <SidebarItem title='Actions'>
          <PlayerAppealActions
            appeal={appeal}
            server={appeal.server}
            onAction={({ appeal: { state, updated }, comment }) => {
              mutate({ ...data, appeal: { ...data.appeal, state, updated } }, false)
              matchMutate('listPlayerAppealComments', mutateCommentInsert(comment), { id: appeal.id })
            }}
          />
        </SidebarItem>}
    </ul>
  )
}
