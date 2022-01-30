import Link from 'next/link'
import ErrorMessages from '../ErrorMessages'
import Loader from '../Loader'
import Avatar from '../Avatar'
import { useApi, useUser } from '../../utils'
import PageHeader from '../PageHeader'

const PlayerAlts = ({ id, color }) => {
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
  if (!data || !data.playerAlts || !data.playerAlts.length) return null

  const alts = data.playerAlts.map(alt => {
    return (
      <div key={alt.id} className='p-4'>
        <div className='flex-col flex justify-center items-center'>
          <div className='flex-shrink-0 text-center'>
            <Link href={`/player/${alt.id}`} passHref>
              <a>
                <Avatar uuid={alt.id} width='50' height='50' />
                <p className='pt-1 text-center'>{alt.name}</p>
              </a>
            </Link>
          </div>
        </div>
      </div>
    )
  })

  return (
    <div>
      <PageHeader title={`Alts${data.player?.ip ? ` - ${data.player.ip}` : ''}`} style={{ borderColor: `${color}` }} />
      <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4'>
        {alts}
      </div>
    </div>
  )
}

export default PlayerAlts
