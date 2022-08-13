import { useState } from 'react'
import { format, formatDistance, fromUnixTime } from 'date-fns'
import resolveConfig from 'tailwindcss/resolveConfig'
import { BsChevronDown } from 'react-icons/bs'
import ResponsiveLine from '../../../charts/ResponsiveLine'
import Dropdown from '../../../Dropdown'
import Loader from '../../../Loader'
import { useApi } from '../../../../utils'
import tailwindConfig from '../../../../tailwind.config'

const fullConfig = resolveConfig(tailwindConfig)
const colour = fullConfig.theme.colors.green['500']

const query = `
query serverReportStats($id: ID!, $intervalDays: Int!) {
  serverReportStats(id: $id, intervalDays: $intervalDays) {
    total
    averageLength
    totalHistory {
      date
      value
    }
  }
}`

export default function ServerReportStats ({ server }) {
  const [intervalDays, setIntervalDays] = useState(7)
  const { loading, data, errors } = useApi({ query, variables: { id: server.id, intervalDays } })

  if (errors) return null

  const chartData = [
    {
      id: 'reports',
      color: colour,
      data: (data?.serverReportStats?.totalHistory || []).map(row => ({
        x: format(fromUnixTime(row.date), 'd MMM yyyy'),
        y: row.value
      }))
    }
  ]

  return (
    <div className='pt-5 bg-black shadow-md rounded-md w-80'>
      <div className='px-5 flex justify-between items-center text-sm text-gray-500'>
        <h5 className='uppercase'>Reports</h5>
        <Dropdown
          trigger={({ onClickToggle }) => (
            <>
              <a onClick={onClickToggle} className='hover:underline cursor-pointer'>Last {intervalDays} days <BsChevronDown className='inline' /></a>
            </>
          )}
        >
          <Dropdown.Item name='Last 7 days' onClick={() => setIntervalDays(7)} />
          <Dropdown.Item name='Last 30 days' onClick={() => setIntervalDays(30)} />
          <Dropdown.Item name='Last 90 days' onClick={() => setIntervalDays(90)} />
        </Dropdown>
      </div>
      <div className='mt-2 flex flex-wrap justify-around'>
        {loading && <Loader />}
        {data &&
          <>
            <div className='text-center'>
              <h2 className='title-font font-medium text-xl'>{data.serverReportStats.total}</h2>
              <p className='leading-relaxed text-sm'>Total</p>
            </div>
            {!!data.serverReportStats?.averageLength &&
              <div className='text-center'>
                <h2 className='title-font font-medium text-xl'>{formatDistance(0, data.serverReportStats.averageLength * 1000, { includeSeconds: true })}</h2>
                <p className='leading-relaxed text-sm'>avg resolution</p>
              </div>}
          </>}
      </div>
      <div className='h-12 mt-6'>
        <ResponsiveLine chartData={chartData} />
      </div>
    </div>
  )
}
