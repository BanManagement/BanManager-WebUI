import { useEffect } from 'react'
import Loader from '../Loader'
import Select from '../Select'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function PlayerReportState ({ id, currentState, states, server, onChange }) {
  const { data, loading, load, errors } = useMutateApi({
    query: /* GraphQL */ `
      mutation reportState($report: ID!, $serverId: ID!, $state: ID!) {
        reportState(report: $report, serverId: $serverId, state: $state) {
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

  const handleChange = (state) => {
    if (currentState?.id !== state.value) {
      load({ report: id, serverId: server, state: state.value })
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
