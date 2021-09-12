import { useState } from 'react'
import { Button, Confirm, List } from 'semantic-ui-react'
import { useMutateApi } from '../../utils'

export default function RoleItem ({ role }) {
  const [state, setState] = useState({ deleteConfirmShow: false, deleting: false })
  const { load, loading } = useMutateApi({
    query: `mutation deleteRole($id: ID!) {
        deleteRole(id: $id) {
          id
        }
      }`
  })
  const showConfirmDelete = () => setState({ deleteConfirmShow: true })
  const handleConfirmDelete = async () => {
    if (state.deleting) return

    setState({ deleteConfirmShow: false, deleting: true })

    load({ id: role.id })

    if (!loading) setState({ deleting: false, deleted: true })
  }
  const handleDeleteCancel = () => setState({ deleteConfirmShow: false })

  if (state.deleted) return null

  return (
    <List.Item key={role.id}>
      {role.id > 3 &&
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
      <List.Content as='a' href={`/admin/roles/${role.id}`}>
        {role.name}
      </List.Content>
    </List.Item>
  )
}
