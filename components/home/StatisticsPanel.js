import { FaBan } from 'react-icons/fa'
import { BsMicMute } from 'react-icons/bs'
import { FiUsers } from 'react-icons/fi'
import { MdOutlineGavel } from 'react-icons/md'
import Loader from '../Loader'
import { numberFormatter, useApi } from '../../utils'

const StatisticsPanel = () => {
  const { data, loading } = useApi({
    query: `query statistics {
    statistics {
      totalActiveBans
      totalActiveMutes
      totalPlayers
      totalAppeals
    }
  }`
  })

  return (
    <div className='px-5 py-12 grid grid-flow-col grid-cols-2 grid-rows-2 xl:grid-cols-4 xl:grid-rows-1 gap-4 -m-4 text-center'>
      <div className='p-4'>
        <div className='bg-black px-4 py-6 rounded-sm'>
          {loading && <Loader />}
          {data &&
            <>
              <FaBan className='text-accent-500 w-12 h-12 mb-3 inline-block' />
              <h2 className='title-font font-medium text-3xl'>{numberFormatter(data?.statistics?.totalActiveBans || 0)}</h2>
              <p className='leading-relaxed'>Ban{data?.statistics?.totalActiveBans > 1 && 's'}</p>
            </>}
        </div>
      </div>
      <div className='p-4'>
        <div className='bg-black px-4 py-6 rounded-sm'>
          {loading && <Loader />}
          {data &&
            <>
              <BsMicMute className='text-accent-500 w-12 h-12 mb-3 inline-block' />
              <h2 className='title-font font-medium text-3xl'>{numberFormatter(data?.statistics?.totalActiveMutes || 0)}</h2>
              <p className='leading-relaxed'>Mute{data?.statistics?.totalActiveMutes > 1 && 's'}</p>
            </>}
        </div>
      </div>
      <div className='p-4'>
        <div className='bg-black px-4 py-6 rounded-sm'>
          {loading && <Loader />}
          {data &&
            <>
              <FiUsers className='text-accent-500 w-12 h-12 mb-3 inline-block' />
              <h2 className='title-font font-medium text-3xl'>{numberFormatter(data?.statistics?.totalPlayers || 0)}</h2>
              <p className='leading-relaxed'>Player{data?.statistics?.totalPlayers > 1 && 's'}</p>
            </>}
        </div>
      </div>
      <div className='p-4'>
        <div className='bg-black px-4 py-6 rounded-sm'>
          {loading && <Loader />}
          {data &&
            <>
              <MdOutlineGavel className='text-accent-500 w-12 h-12 mb-3 inline-block' />
              <h2 className='title-font font-medium text-3xl'>{numberFormatter(data?.statistics?.totalAppeals || 0)}</h2>
              <p className='leading-relaxed'>Appeal{data?.statistics?.totalAppeals > 1 && 's'}</p>
            </>}
        </div>
      </div>
    </div>
  )
}

export default StatisticsPanel
