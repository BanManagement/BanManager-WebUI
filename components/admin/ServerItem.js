import { useState } from 'react';
import { Button, Confirm, List } from 'semantic-ui-react'
import { useMutateApi } from '../../utils'

export default function ServerItem ({ canDelete, server }) {
  const [state, setState] = useState({ deleteConfirmShow: false, deleting: false })
  const { load, loading } = useMutateApi({
    query: `mutation deleteServer($id: ID!) {
        deleteServer(id: $id)
      }`
  })
  const showConfirmDelete = () => setState({ deleteConfirmShow: true })
  const handleConfirmDelete = async () => {
    if (state.deleting) return

    setState({ deleteConfirmShow: false, deleting: true })

    load({ id: server.id })

    if (!loading) setState({ deleting: false })
  }
  const handleDeleteCancel = () => setState({ deleteConfirmShow: false })

  return (
    <List.Item key={server.id}>
      {canDelete &&
        <List.Content floated='right'>
          <Confirm
            open={state.deleteConfirmShow}
            onConfirm={handleConfirmDelete}
            onCancel={handleDeleteCancel}
          />
          <Button
            color='red'
            icon='trash'
            loading={state.deleting}
            disabled={state.deleting}
            onClick={showConfirmDelete}
          />
        </List.Content>}
      <List.Content as='a' href={`/admin/servers/${server.id}`}>
        {server.name}
      </List.Content>
    </List.Item>
  )
}
