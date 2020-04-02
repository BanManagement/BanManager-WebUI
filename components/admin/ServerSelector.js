import React, { useEffect, useState } from 'react'
import { Dropdown } from 'semantic-ui-react'
import { useApi } from '../../utils'

export default function ServerSelector ({ handleChange, value, fluid = true, selectOnBlur = false }) {
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(value || null)
  const query = `query servers {
    servers {
      id
      name
    }
  }`

  const { data, errors } = useApi({ query }, {
    loadOnMount: true,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: false
  })

  useEffect(() => {
    setLoading(false)

    if (data && !selected) setSelected(data.servers[0].id)
  }, [data, errors])
  useEffect(() => handleChange(selected), [selected])

  const handleServerChange = (e, { value }) => setSelected(value)

  const options = data ? data.servers.map(result => ({
    key: result.id, text: result.name, value: result.id
  })) : []

  return (
    <Dropdown
      fluid={fluid}
      options={options}
      onChange={handleServerChange}
      disabled={loading}
      loading={loading}
      selectOnBlur={selectOnBlur}
      defaultValue={options.length ? options[0].value : null}
    />
  )
}

export const query = `

`
