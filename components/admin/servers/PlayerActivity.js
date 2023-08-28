import { useState } from 'react'
import { fromUnixTime, getUnixTime } from 'date-fns'
import { capitalize } from 'lodash-es'
import Link from 'next/link'
import { AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai'
import { BiTime } from 'react-icons/bi'
import { MdClear, MdFilterAlt } from 'react-icons/md'
import { Disclosure } from '@headlessui/react'
import NavigationOverlay from '../../NavigationOverlay'
import Checkbox from '../../Checkbox'
import Loader from '../../Loader'
import Avatar from '../../Avatar'
import { useApi } from '../../../utils'
import { Time, TimeDuration, TimeFromNow } from '../../Time'
import PlayerSelector from '../PlayerSelector'
import DateTimePicker from '../../DateTimePicker'
import Button from '../../Button'
import ErrorMessages from '../../ErrorMessages'
import Message from '../../Message'
import ActivityBadge from './ActivityBadge'

const query = `
  query playerActivity($serverId: ID!, $actor: UUID, $createdStart: Timestamp, $createdEnd: Timestamp, $types: [PlayerActivityType!]!, $limit: Int) {
    playerActivity(serverId: $serverId, actor: $actor, createdStart: $createdStart, createdEnd: $createdEnd, types: $types, limit: $limit) {
      records {
        type
        created
        fromIp
        toIp
        reason
        expired
        player {
          id
          name
        }
        actor {
          id
          name
        }
      }
    }
  }`
const types = [
  'BAN',
  'UNBAN',
  'MUTE',
  'UNMUTE',
  'IPMUTE',
  'IPUNMUTE',
  'IPBAN',
  'IPUNBAN',
  'IPRANGEBAN',
  'IPRANGEUNBAN',
  'NOTE',
  'WARNING'
]

const ActivityRow = ({ row, index }) => {
  const message = []

  switch (row.type) {
    case 'BAN':
      message.push('Banned')
      break
    case 'IPBAN':
      message.push(`Banned ${row.fromIp}`)
      break
    case 'UNBAN':
      message.push('Unbanned')
      break
    case 'UNBANIP':
      message.push(`Unbanned ${row.fromIp}`)
      break
    case 'IPRANGEBAN':
      message.push(`Banned ${row.fromIp} - ${row.toIp}`)
      break
    case 'IPRANGEUNBAN':
      message.push(`Unbanned ${row.fromIp} - ${row.toIp}`)
      break
    case 'MUTE':
      message.push('Muted')
      break
    case 'IPMUTE':
      message.push(`Muted ${row.fromIp}`)
      break
    case 'UNMUTE':
      message.push('Unmuted')
      break
    case 'IPUNMUTE':
      message.push(`Unmuted ${row.fromIp}`)
      break
    case 'WARNING':
      message.push('Warned')
      break
    case 'NOTE':
      message.push('Created a note for')
      break
  }

  if (row?.player?.id) {
    message.push(<Link key={'player' + index + row.type + row.created} href={`/player/${row?.player?.id}`} className='underline'>{row?.player?.name}</Link>)
  }

  if (row?.expired && row?.expired !== 0 && !row?.type?.startsWith('UN')) {
    message.push(<span key={'expired' + index + row.type + row.created}>for <span className='text-gray-400'><TimeDuration startTimestamp={row.created} endTimestamp={row.expired} /></span></span>)
  }

  if (row?.reason) {
    message.push(<code key={'reason' + index + row.type + row.created} className='bg-primary-900 ml-1 p-1 text-sm text-accent-500'>{row.reason}</code>)
  }

  return (
    <div className='hover:bg-gray-900'>
      <div className='flex py-2 border-b border-gray-700'>
        <div className='flex flex-col justify-center pl-3 mt-1 mr-2'>
          <div className='flex-shrink-0 text-center'>
            <Link href={`/player/${row.actor.id}`}>
              <Avatar uuid={row.actor.id} width={38} height={38} />
            </Link>
          </div>
        </div>
        <div className='flex-auto flex-wrap space-y-2 pl-3 py-2'>
          <div className='flex break-words justify-between text-sm'>
            <span className='self-center'>
              <Link href={`/player/${row.actor.id}`} className='underline'>{row.actor.name}</Link>
            </span>
            <span>
              <ActivityBadge type={row.type} temporary={row?.expired !== 0} />
            </span>
          </div>
          <div className='pt-2'>
            {message.length > 0 ? message.reduce((prev, curr) => [prev, ' ', curr]) : ''}
          </div>
          <div>
            <TimeFromNow timestamp={row.created} />
          </div>
        </div>
      </div>
    </div>
  )
}

const ActivityFilterTypes = ({ stateTypes, handleTypeChange }) => {
  return types.map((type, optionIdx) => (
    <div key={type} className='flex items-center'>
      <Checkbox
        id={`filter-${type}-${optionIdx}`}
        name={type}
        label={capitalize(type.replace('IP', 'IP ').replace('RANGE', 'range '))}
        inputClassName='checked:bg-accent-500'
        checked={stateTypes.includes(type)}
        onChange={handleTypeChange}
      />
    </div>
  ))
}

export default function PlayerActivity ({ server }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [tableState, setTableState] = useState({ serverId: server.id, limit: 100, actor: null, createdStart: null, createdEnd: null, types })
  const { errors, loading, data } = useApi({ query: !tableState.serverId ? null : query, variables: tableState })
  const onDateTimeChange = (field) => (date) => setTableState({ ...tableState, [field]: getUnixTime(date) })
  const disableFuture = current => current <= new Date()

  const handleTypeChange = (e, { name, checked }) => {
    let newTypes

    if (checked) {
      newTypes = [...tableState.types, name]
    } else {
      newTypes = tableState.types.filter(type => type !== name)
    }

    if (!newTypes.length) newTypes = [...types]

    setTableState({ ...tableState, types: newTypes })
  }

  return (
    <>
      <NavigationOverlay drawerOpen={drawerOpen} setDrawerOpen={setDrawerOpen}>
        <NavigationOverlay.Header>
          <h2 className='text-lg font-medium'>Filters</h2>
        </NavigationOverlay.Header>
        <hr className='border-accent-200 w-full' />
        <NavigationOverlay.Body>
          <div className='grid grid-cols-1 gap-y-10'>
            <Disclosure as='div' className='pt-6'>
              {({ open }) => (
                <>
                  <h3 className='-mx-2 -my-3 flow-root'>
                    <Disclosure.Button className='px-2 py-3 w-full'>
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>Start Date</span>
                        <span className='ml-6 flex items-center'>
                          {open
                            ? (
                              <AiOutlineMinus className='h-5 w-5' aria-hidden='true' />
                              )
                            : (
                              <AiOutlinePlus className='h-5 w-5' aria-hidden='true' />
                              )}
                        </span>
                      </div>
                      {tableState.createdStart &&
                        <div className='flex items-center justify-between mt-3'>
                          <span className='text-sm text-gray-300'>
                            <Time timestamp={tableState.createdStart} />
                          </span>
                          <MdClear className='w-6 h-6 cursor-pointer' onClick={() => setTableState({ ...tableState, createdStart: null })} />
                        </div>}
                    </Disclosure.Button>
                  </h3>
                  <Disclosure.Panel className='pt-6'>
                    <DateTimePicker
                      shouldHideInput
                      className='px-0'
                      value={tableState.createdStart ? fromUnixTime(tableState.createdStart) : null}
                      onChange={onDateTimeChange('createdStart')}
                      isValidDate={disableFuture}
                    />
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
            <Disclosure as='div'>
              {({ open }) => (
                <>
                  <h3 className='-mx-2 -my-3 flow-root'>
                    <Disclosure.Button className='px-2 py-3 w-full'>
                      <div className='flex items-center justify-between'>
                        <span className='font-medium'>End Date</span>
                        <span className='ml-6 flex items-center'>
                          {open
                            ? (
                              <AiOutlineMinus className='h-5 w-5' aria-hidden='true' />
                              )
                            : (
                              <AiOutlinePlus className='h-5 w-5' aria-hidden='true' />
                              )}
                        </span>
                      </div>
                      {tableState.createdEnd &&
                        <div className='flex items-center justify-between mt-3'>
                          <span className='text-sm text-gray-300'>
                            <Time timestamp={tableState.createdEnd} />
                          </span>
                          <MdClear className='w-6 h-6 cursor-pointer' onClick={() => setTableState({ ...tableState, createdEnd: null })} />
                        </div>}
                    </Disclosure.Button>
                  </h3>
                  <Disclosure.Panel className='pt-6'>
                    <DateTimePicker
                      shouldHideInput
                      className='px-0'
                      value={tableState.createdEnd ? fromUnixTime(tableState.createdEnd) : null}
                      onChange={onDateTimeChange('createdEnd')}
                      isValidDate={disableFuture}
                    />
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
        </NavigationOverlay.Body>
        <hr className='mt-6 border-accent-200 w-full' />
        <NavigationOverlay.Body>
          <div className='pt-2'>
            <div className='py-4'>
              <PlayerSelector
                multiple={false}
                onChange={(actor) => setTableState({ ...tableState, actor })}
                placeholder='Actor'
                value={tableState.actor}
              />
            </div>
            <div>
              <Button className='px-4 py-2' disabled={!tableState.actor} onClick={() => setTableState({ ...tableState, actor: null })}>Clear</Button>
            </div>
          </div>
        </NavigationOverlay.Body>
        <hr className='mt-6 border-accent-200 w-full' />
        <NavigationOverlay.Body>
          <div>
            <div className='text-sm font-medium pt-4'>
              <ActivityFilterTypes handleTypeChange={handleTypeChange} stateTypes={tableState.types} />
            </div>
          </div>
        </NavigationOverlay.Body>
      </NavigationOverlay>
      <div className='relative flex justify-between items-center pb-6 border-b border-gray-200'>
        <h2 className='text-xl font-bold leading-none'>Activity Summary</h2>
        <div className='flex items-center'>
          <button
            type='button'
            className='text-gray-400 hover:text-gray-500 lg:hidden'
            onClick={() => setDrawerOpen(true)}
          >
            <span className='sr-only'>Filters</span>
            <MdFilterAlt className='w-6 h-6' />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-4 gap-x-8 gap-y-10 pt-2'>
        <div className='hidden lg:block lg:pt-2'>
          {data?.playerActivity?.records?.length === tableState.limit &&
            <div className='text-sm font-medium'>
              <Message warning>
                <Message.Header>Warning</Message.Header>
                <Message.List>
                  <Message.Item>Results are limited, use the filters to see more</Message.Item>
                </Message.List>
              </Message>
            </div>}
          <div className='border-b border-accent-200 pb-4 flex items-center gap-4'>
            {!tableState.createdStart && !tableState.createdEnd
              ? <BiTime className='w-7 h-7' />
              : <MdClear className='w-7 h-7 cursor-pointer' onClick={() => setTableState({ ...tableState, createdStart: null, createdEnd: null })} />}
            <DateTimePicker isValidDate={disableFuture} value={tableState.createdStart ? fromUnixTime(tableState.createdStart) : null} onChange={onDateTimeChange('createdStart')} />
            <p>-</p>
            <DateTimePicker isValidDate={disableFuture} value={tableState.createdEnd ? fromUnixTime(tableState.createdEnd) : null} onChange={onDateTimeChange('createdEnd')} />
          </div>
          <div className='border-b border-accent-200 py-4'>
            <PlayerSelector
              multiple={false}
              onChange={(actor) => setTableState({ ...tableState, actor })}
              placeholder='Actor'
              value={tableState.actor}
              clearable
            />
          </div>

          <div className='text-sm font-medium pt-4 border-b border-accent-200'>
            <ActivityFilterTypes handleTypeChange={handleTypeChange} stateTypes={tableState.types} />
          </div>
        </div>

        <div className='lg:col-span-3'>
          {errors && <ErrorMessages errors={errors} />}
          {loading
            ? <Loader />
            : data?.playerActivity?.records?.map((row, i) => (<ActivityRow row={row} key={i} index={i} />))}
        </div>
      </div>
    </>
  )
}
