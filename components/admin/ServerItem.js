import React, { useState } from 'react'
import { Button, Confirm, List } from 'semantic-ui-react'
import { useApi } from '../../utils'

export default function ServerItem ({ canDelete, server }) {
  const [state, setState] = useState({ deleteConfirmShow: false, deleting: false })
  const { load, loading } = useApi({
    query: `mutation deleteServer($id: ID!) {
        deleteServer(id: $id)
      }`,
    variables: { id: server.id }
  }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })
  const showConfirmDelete = () => setState({ deleteConfirmShow: true })
  const handleConfirmDelete = async () => {
    if (state.deleting) return

    setState({ deleteConfirmShow: false, deleting: true })

    load()

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
