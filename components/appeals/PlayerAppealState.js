import { useEffect } from 'react'
import Loader from '../Loader'
import Select from '../Select'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function PlayerAppealState ({ id, currentState, states, onChange }) {
  const { data, loading, load, errors } = useMutateApi({
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

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key]?.appeal?.updated)) {
      onChange(data)
    }
  }, [data])

  const handleChange = (state) => {
    if (currentState?.id !== state.value) {
      load({ id, state: state.value })
    }
  }

  if (loading) return <Loader />

  return (
    <>
      <ErrorMessages errors={errors} />
      <Select
        defaultValue={currentState ? ({ value: currentState.id, label: currentState.name }) : null}
        options={states}
        onChange={handleChange}
      />
    </>
  )
}
