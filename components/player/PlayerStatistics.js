import { FaBan } from 'react-icons/fa'
import { BsMicMute } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'
import ErrorMessages from '../ErrorMessages'
import Loader from '../Loader'
import { useApi } from '../../utils'
import Link from 'next/link'

const PlayerStatistics = ({ id }) => {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `query playerStatistics($id: UUID!) {
      playerStatistics(player: $id) {
        totalActiveBans
        totalBans
        totalMutes
        totalActiveMutes
        totalWarnings
      }
    }`
  })

  if (loading) return <Loader />
  if (errors) return <ErrorMessages errors={errors} />
  if (!data || !data.playerStatistics) return null

  return (
    <div className='grid grid-cols-3 gap-4 text-center'>
      <div>
        <Link href='#bans'>
          <div className='py-4 transform transition duration-500 hover:scale-110 justify-center items-center flex flex-col gap-1'>
            <FaBan className='w-8 h-8 inline-block text-red-800' />
            <h2 className='title-font font-medium'>{data.playerStatistics.totalBans + data.playerStatistics.totalActiveBans}</h2>
            <p className='text-sm text-gray-400'>Bans</p>
          </div>
        </Link>
      </div>
      <div>
        <Link href='#mutes'>
          <div className='py-4 transform transition duration-500 hover:scale-110 justify-center items-center flex flex-col gap-1'>
            <BsMicMute className='w-8 h-8 inline-block text-indigo-800' />
            <h2 className='title-font font-medium'>{data.playerStatistics.totalMutes + data.playerStatistics.totalActiveMutes}</h2>
            <p className='text-sm text-gray-400'>Mutes</p>
          </div>
        </Link>
      </div>
      <div>
        <Link href='#warnings'>
          <div className='py-4 transform transition duration-500 hover:scale-110 justify-center items-center flex flex-col gap-1'>
            <AiOutlineWarning className='w-8 h-8 inline-block text-amber-800' />
            <h2 className='title-font font-medium'>{data.playerStatistics.totalWarnings}</h2>
            <p className='text-sm text-gray-400'>Warnings</p>
          </div>
        </Link>
      </div>
    </div>
  )
}

export default PlayerStatistics
