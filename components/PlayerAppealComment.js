import { useEffect, useState } from 'react'
import { Comment, Confirm } from 'semantic-ui-react'
import ErrorMessages from './ErrorMessages'
import { fromNow, useMutateApi } from '../utils'

export default function PlayerAppealComment ({ id, actor, created, comment, acl, serverId, onFinish }) {
  const [state, setState] = useState({ deleteConfirmShow: false, deleting: false })
  const { load, data, loading, errors } = useMutateApi({
    query: `mutation deleteAppealComment($id: ID!) {
      deleteAppealComment(id: $id) {
        id
        acl {
          delete
        }
      }
    }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].id)) {
      onFinish(data)
    }
  }, [data])
  const showConfirmDelete = () => setState({ deleteConfirmShow: true })
  const handleConfirmDelete = async () => {
    if (state.deleting) return

    setState({ deleteConfirmShow: false, deleting: true })

    load({ id, serverId })

    if (!loading) setState({ deleting: false })
  }
  const handleDeleteCancel = () => setState({ deleteConfirmShow: false })

  return (
    <Comment>
      <Confirm
        open={state.deleteConfirmShow}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
      />
      <ErrorMessages errors={errors} />
      <Comment.Avatar src={`https://crafatar.com/avatars/${actor.id}?size=128&overlay=true`} />
      <Comment.Content>
        <Comment.Author as='a' href={`/player/${actor.id}`}>{actor.name}</Comment.Author>
        <Comment.Metadata>
          <div>{fromNow(created)}</div>
        </Comment.Metadata>
        <Comment.Text>{comment}</Comment.Text>
        <Comment.Actions>
          {acl.delete &&
            <Comment.Action onClick={showConfirmDelete}>Delete</Comment.Action>}
        </Comment.Actions>
      </Comment.Content>
    </Comment>
  )
}
