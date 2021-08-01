import React, { useEffect, useState } from 'react'
import { Dropdown } from 'semantic-ui-react'
import { useApi } from '../../utils'

export default function PlayerSelector ({ clearable = false, handleChange, multiple = true, value, options: defaultOptions = [], fluid = true, placeholder = 'Select players', limit = 5, selectOnBlur = false }) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [selected, setSelected] = useState(multiple ? [] : value || null)
  const query = `query searchPlayers($name: String!, $limit: Int!) {
    searchPlayers(name: $name, limit: $limit) {
      id
      name
    }
  }`

  const { load, data, errors } = useApi({ query, variables: { limit, name } }, {
    loadOnMount: false,
    loadOnReload: false,
    loadOnReset: false,
    reloadOnLoad: true
  })

  useEffect(() => setLoading(false), [data, errors])
  useEffect(() => {
    if (!name) return

    setLoading(true)
    load()
  }, [name])
  useEffect(() => {
    handleChange(selected)
  }, [selected])

  const handlePlayerChange = (e, { value }) => setSelected(value)
  const handleSearchChange = (e, { searchQuery }) => {
    setName(searchQuery)
  }

  const options = data ? data.searchPlayers.map(result => ({
    key: result.id, text: result.name, value: result.id, image: `https://crafatar.com/avatars/${result.id}?size=128&overlay=true`
  })) : defaultOptions

  return (
    <Dropdown
      fluid={fluid}
      selection
      clearable={clearable}
      multiple={multiple}
      search
      options={options}
      value={selected}
      placeholder={placeholder}
      onChange={handlePlayerChange}
      onSearchChange={handleSearchChange}
      disabled={loading}
      loading={loading}
      selectOnBlur={selectOnBlur}
    />
  )
}

export const query = `

`
