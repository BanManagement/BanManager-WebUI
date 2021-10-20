import { useEffect } from 'react'
import { Dropdown, Loader } from 'semantic-ui-react'
import { useMutateApi } from '../utils'

export default function PlayerAppealState ({ id, currentState, states, onChange }) {
  const { data, loading, load } = useMutateApi({
    query: /* GraphQL */ `
      mutation appealState($id: ID!, $state: ID!) {
        appealState(report: $id, state: $state) {
          updated
          state {
            id
            name
          }
        }
      }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key].updated)) {
      onChange(data)
    }
  }, [data])

  const handleChange = (e, { value }) => {
    if (currentState?.id !== value) {
      load({ id, state: value })
    }
  }

  if (loading) return <Loader active />

  return (
    <Dropdown
      selection
      fluid={false}
      value={currentState?.id}
      options={states}
      onChange={handleChange}
    />
  )
}
