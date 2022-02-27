import { forwardRef, useEffect, useState } from 'react'
import Select from '../Select'
import { useApi } from '../../utils'

// eslint-disable-next-line react/display-name
const ServerSelector = forwardRef(({ onChange, filter = () => true, value, ...rest }, ref) => {
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(value || null)
  const query = `query servers {
    servers {
      id
      name
    }
  }`
  const { loading: queryLoading, data, errors } = useApi({ query })

  useEffect(() => {
    setLoading(false)

    if (data && !selected) setSelected(data.servers[0].id)
  }, [data, errors])
  useEffect(() => onChange(selected), [selected])

  if (queryLoading) return null

  const handleOnChange = ({ value }) => onChange(value)

  const options = data
    ? data.servers.filter(filter).map(result => ({
        label: result.name, value: result.id
      }))
    : []

  return (
    <Select
      options={options}
      onChange={handleOnChange}
      isLoading={loading}
      defaultValue={options.length ? options[0] : null}
      ref={ref}
      {...rest}
    />
  )
})

export default ServerSelector
