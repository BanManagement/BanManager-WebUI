import Loader from '../Loader'
import Select from '../Select'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function PlayerAppealState ({ id, currentState, states, onChange }) {
  const { loading, load, errors } = useMutateApi({
    query: /* GraphQL */ `
      mutation appealState($id: ID!, $state: ID!) {
        appealState(id: $id, state: $state) {
          appeal {
            updated
            state {
              id
              name
            }
          }
          comment {
            id
            type
            content
            created
            actor {
              id
              name
            }
            assignee {
              id
              name
            }
            state {
              id
              name
            }
            acl {
              delete
            }
          }
        }
      }`
  })

  const handleChange = async (state) => {
    if (currentState?.id === state.value) return

    const data = await load({ id, state: state.value })

    if (data?.appealState?.appeal?.updated) {
      onChange(data)
    }
  }

  if (loading) return <Loader />

  return (
    <>
      <ErrorMessages errors={errors} />
      <Select
        value={currentState?.id}
        options={states}
        onChange={handleChange}
      />
    </>
  )
}
