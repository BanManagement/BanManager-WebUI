import Link from 'next/link'
import ErrorMessages from '../ErrorMessages'
import Loader from '../Loader'
import Avatar from '../Avatar'
import { useApi, useUser } from '../../utils'

const PlayerAlts = ({ id }) => {
  const { hasServerPermission } = useUser()
  const { loading, data, errors } = useApi({
    variables: { id },
    query: `query playerAlts($id: UUID!) {
      playerAlts(player: $id) {
        id
        name
      }
      ${hasServerPermission('player.ips', 'view', null, true) ? 'player(player: $id) { ip }' : ''}
    }`
  })

  if (loading) return <Loader />
  if (errors) return <ErrorMessages errors={errors} />
  if (!data) return null

  const alts = data.playerAlts?.map(alt => {
    return (
      <div key={alt.id}>
        <Link href={`/player/${alt.id}`} className='flex flex-col gap-1 text-center justify-center items-center'>
          <Avatar uuid={alt.id} width='50' height='50' />
          <p className='text-center'>{alt.name}</p>
        </Link>
      </div>
    )
  })

  return (
    <div className='mb-3'>
      {data?.player?.ip && <h2 className='text-xs tracking-widest title-font text-center font-medium text-gray-400 uppercase py-2 mb-4'>{data.player.ip}</h2>}
      {data?.playerAlts?.length > 0 && <div className='flex flex-wrap items-center justify-center text-center gap-4'>{alts}</div>}
    </div>
  )
}

export default PlayerAlts
