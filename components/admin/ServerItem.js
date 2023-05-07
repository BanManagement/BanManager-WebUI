import { useEffect, useState } from 'react'
import { FaBan } from 'react-icons/fa'
import { BsMicMute } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'
import { GoReport } from 'react-icons/go'
import clsx from 'clsx'
import Link from 'next/link'
import ResponsivePie, { PieContext } from '../charts/ResponsivePie'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'
import Modal from '../Modal'
import { useMutateApi } from '../../utils'
import ErrorMessages from '../ErrorMessages'
import Message from '../Message'
import Input from '../Input'

const fullConfig = resolveConfig(tailwindConfig)

const StatItem = ({ onClick, icon, value, selected }) => {
  return (
    <div onMouseEnter={onClick} onClick={onClick} className={clsx('p-4 mx-2 rounded-md', { 'bg-gray-900': !selected, 'bg-gray-700': selected })}>
      {icon}
      {value}
    </div>
  )
}

export default function ServerItem ({ canDelete, server, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState('')
  const { load, loading, errors, data } = useMutateApi({
    query: `mutation deleteServer($id: ID!) {
        deleteServer(id: $id)
      }`
  })

  useEffect(() => {
    if (!data) return
    if (Object.keys(data).some(key => !!data[key])) {
      setOpen(false)
      onDeleted(data)
    }
  }, [data])

  const showConfirmDelete = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirmDelete = async () => {
    setConfirmValue('')
    await load({ id: server.id })
  }
  const handleDeleteCancel = () => {
    setConfirmValue('')
    setOpen(false)
  }

  const chartData = [
    {
      id: 'bans' + server.id,
      label: 'active bans',
      value: server.stats.totalActiveBans,
      color: fullConfig.theme.colors.red['500']
    },
    {
      id: 'mutes' + server.id,
      label: 'active mutes',
      value: server.stats.totalActiveMutes,
      color: fullConfig.theme.colors.indigo['500']
    },
    {
      id: 'reports' + server.id,
      label: 'reports',
      value: server.stats.totalReports,
      color: fullConfig.theme.colors.green['500']
    },
    {
      id: 'warnings' + server.id,
      label: 'warnings',
      value: server.stats.totalWarnings,
      color: fullConfig.theme.colors.amber['500']
    }
  ]

  return (
    <div className='bg-black shadow-md rounded-md overflow-hidden text-center w-80'>
      <Modal
        icon={<AiOutlineWarning className='h-6 w-6 text-red-600' aria-hidden='true' />}
        title='Delete server'
        confirmButton='Delete'
        confirmDisabled={confirmValue !== server.name}
        open={open}
        onConfirm={handleConfirmDelete}
        onCancel={handleDeleteCancel}
        loading={loading}
      >
        <ErrorMessages errors={errors} />
        <Message warning>
          <Message.Header>Warning</Message.Header>
          <Message.List>
            <Message.Item>Related <strong>appeals and roles</strong> will be removed</Message.Item>
            <Message.Item>This action cannot be undone</Message.Item>
          </Message.List>
        </Message>
        <p className='mb-4'>Please type <strong>{server.name}</strong> to confirm</p>
        <Input
          onChange={(e, { value }) => setConfirmValue(value)}
          placeholder='Type server name'
          className='mb-0'
          inputClassName='border border-gray-900'
          required
        />
      </Modal>
      <div className='pt-5 px-5 flex justify-between items-center'>
        <h5 className='text-xl font-semibold mb-2 underline'>
          <Link href={`/admin/servers/${server.id}`} legacyBehavior>
            {server.name}
          </Link>
        </h5>
        <div>
          {canDelete &&
            <button
              className='
                bg-red-500
                text-white
                active:bg-red-600
                font-bold
                uppercase
                text-xs
                px-4
                py-2
                rounded
                shadow
                hover:shadow-md
                outline-none
                focus:outline-none
                mr-1
                mb-1
                ease-linear
                transition-all
                duration-150
              '
              type='button'
              onClick={showConfirmDelete}
            >
              Delete
            </button>}
        </div>
      </div>
      <ResponsivePie
        chartData={chartData}
        selectedLabel='active bans'
      >
        <PieContext.Consumer>
          {({ setSelectedLabel, selectedLabel }) => (
            <div className='grid grid-cols-4 pb-6 px-2'>
              <StatItem
                icon={<FaBan className='w-6 h-6 inline-block mb-3 text-red-500' />}
                selected={selectedLabel === 'active bans'}
                onClick={() => setSelectedLabel('active bans')}
                value={server.stats.totalActiveBans}
              />
              <StatItem
                icon={<BsMicMute className='w-6 h-6 inline-block mb-3 text-indigo-500' />}
                selected={selectedLabel === 'active mutes'}
                onClick={() => setSelectedLabel('active mutes')}
                value={server.stats.totalActiveMutes}
              />
              <StatItem
                icon={<GoReport className='w-6 h-6 inline-block mb-3 text-green-500' />}
                selected={selectedLabel === 'reports'}
                onClick={() => setSelectedLabel('reports')}
                value={server.stats.totalReports}
              />
              <StatItem
                icon={<AiOutlineWarning className='w-6 h-6 inline-block mb-3 text-amber-500' />}
                selected={selectedLabel === 'warnings'}
                onClick={() => setSelectedLabel('warnings')}
                value={server.stats.totalWarnings}
              />
            </div>
          )}
        </PieContext.Consumer>
      </ResponsivePie>
    </div>
  )
}
