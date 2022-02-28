import { FaBan } from 'react-icons/fa'
import { BsMicMute } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'
import { GoReport } from 'react-icons/go'
import ErrorMessages from '../ErrorMessages'
import Loader from '../Loader'
import { useApi } from '../../utils'

const PlayerStatistics = ({ id, color }) => {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `query playerStatistics($id: UUID!) {
      playerStatistics(player: $id) {
        totalBans
        totalMutes
        totalReports
        totalWarnings
      }
    }`
  })

  if (loading) return <Loader />
  if (errors) return <ErrorMessages errors={errors} />
  if (!data || !data.playerStatistics) return null

  return (
    <div className='grid grid-flow-col grid-cols-2 grid-rows-2 xl:grid-cols-4 xl:grid-rows-1 gap-6 mt-10 mb-10'>
      <div className='grid grid-flow-col'>
        <div className='col-span-1'>
          <FaBan className='w-8 h-8 inline-block' style={{ color }} />
        </div>
        <div className='col-span-11'>
          <p className='text-3xl'>{data.playerStatistics.totalBans}</p>
          <p className='text-xs uppercase font-medium text-gray-400'>Bans</p>
        </div>
      </div>
      <div className='grid grid-flow-col'>
        <div>
          <BsMicMute className='w-8 h-8 inline-block' style={{ color }} />
        </div>
        <div className='col-span-11'>
          <p className='text-3xl'>{data.playerStatistics.totalMutes}</p>
          <p className='text-xs uppercase font-medium text-gray-400'>Mutes</p>
        </div>
      </div>
      <div className='grid grid-flow-col'>
        <div>
          <GoReport className='w-8 h-8 inline-block' style={{ color }} />
        </div>
        <div className='col-span-11'>
          <p className='text-3xl'>{data.playerStatistics.totalReports}</p>
          <p className='text-xs uppercase font-medium text-gray-400'>Reports</p>
        </div>
      </div>
      <div className='grid grid-flow-col'>
        <div>
          <AiOutlineWarning className='w-8 h-8 inline-block' style={{ color }} />
        </div>
        <div className='col-span-11'>
          <p className='text-3xl'>{data.playerStatistics.totalWarnings}</p>
          <p className='text-xs uppercase font-medium text-gray-400'>Warnings</p>
        </div>
      </div>
    </div>
  )
}

export default PlayerStatistics
