import { forwardRef, useEffect, useState } from 'react'
import Select from '../Select'
import { useApi } from '../../utils'
import Loader from '../Loader'
import { BiServer } from 'react-icons/bi'

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
  useEffect(() => {
    onChange(selected)
  }, [selected])

  if (queryLoading) return <Loader className='relative h-9 w-9 mb-2' />

  const handleOnChange = (e) => onChange(e?.value)

  const options = data
    ? data.servers.filter(filter).map(result => ({
        label: (
          <div className='flex items-center'>
            <BiServer
              width='28'
              height='28'
              className='flex-shrink-0 h-6 w-6'
            />
            <span className='ml-3 block font-normal truncate'>
              {result.name}
            </span>
          </div>
        ),
        value: result.id
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
