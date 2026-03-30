import Loader from '../Loader'
import Select from '../Select'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'

export default function PlayerReportState ({ id, currentState, states, server, onChange }) {
  const { loading, load, errors } = useMutateApi({
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

  const handleChange = async (state) => {
    if (currentState?.id === state.value) return

    const data = await load({ report: id, serverId: server, state: state.value })

    if (data?.reportState?.updated) {
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
