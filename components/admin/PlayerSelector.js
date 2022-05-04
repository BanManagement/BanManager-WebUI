import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react'
import Select from '../Select'
import { useMutateApi } from '../../utils'
import Avatar from '../Avatar'

// eslint-disable-next-line react/display-name
const PlayerSelector = forwardRef(({ clearable = false, onChange, multiple = true, value, options: defaultOptions = [], placeholder = 'Select players', limit = 5, ...rest }, ref) => {
  const [name, setName] = useState('')
  const [options, setOptions] = useState(defaultOptions)
  const [selected, setSelected] = useState(multiple ? [] : value || null)
  const query = `query searchPlayers($name: String!, $limit: Int!) {
    searchPlayers(name: $name, limit: $limit) {
      id
      name
    }
  }`

  const { loading, load, data } = useMutateApi({ query })

  useEffect(() => {
    onChange(selected)
  }, [selected])
  useEffect(() => {
    if (name) load({ limit, name })
  }, [name])
  useEffect(() => {
    const newOptions = data
      ? data.searchPlayers.map(result => ({
          label: (
            <div className='flex items-center'>
              <Avatar
                width='28'
                height='28'
                uuid={result.id}
                className='flex-shrink-0 h-6 w-6'
              />
              <span className='ml-3 block font-normal truncate'>
                {result.name}
              </span>
            </div>
          ),
          value: result.id
        }))
      : defaultOptions

    setOptions(newOptions)
  }, [data])

  const filterOption = useCallback(() => true, [])
  const noOptionsMessage = useMemo(() => (loading ? () => 'Loading…' : () => 'No players found'), [loading])
  const handlePlayerChange = (selectedOptions) => {
    if (selectedOptions?.value) return setSelected(selectedOptions.value)

    setSelected(selectedOptions?.map(selected => selected.value))
  }
  const handleSearchChange = (value) => {
    if (value) {
      setName(value)
    }
  }

  return (
    <Select
      ref={ref}
      options={options}
      isLoading={loading}
      onInputChange={handleSearchChange}
      onChange={handlePlayerChange}
      value={value}
      filterOption={filterOption}
      noOptionsMessage={noOptionsMessage}
      isClearable={clearable}
      placeholder={placeholder}
      isMulti={multiple}
      {...rest}
    />
  )
})

const Label = ({ player }) => {
  return (
    <div className='flex items-center'>
      <Avatar
        width='28'
        height='28'
        uuid={player.id}
        className='flex-shrink-0 h-6 w-6'
      />
      <span className='ml-3 block font-normal truncate'>
        {player.name}
      </span>
    </div>
  )
}

PlayerSelector.Label = Label

export default PlayerSelector
