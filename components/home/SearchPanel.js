import { useRouter } from 'next/router'
import Link from 'next/link'
import { useApi } from '../../utils'
import PlayerSelector from '../admin/PlayerSelector'
import Loader from '../Loader'
import Avatar from '../Avatar'

const SearchPanel = () => {
  const router = useRouter()
  const query = `query searchPlayers($name: String!, $limit: Int!) {
    searchPlayers(name: $name, limit: $limit) {
      id
      name
    }
  }`

  const { loading, data } = useApi({ query, variables: { limit: 6, name: '' } })

  return (
    <div className='h-full p-6 flex flex-col relative text-center md:border-2 md:border-black'>
      <h2 className='text-xs tracking-widest title-font mb-5 font-medium uppercase'>Find a player</h2>
      <h1 className='text-5xl pb-4 mb-4 border-b border-accent-200 leading-none'>Search</h1>
      <p className='flex items-center mb-6'>
        Check the full punishment history of a player, including current bans, mutes and more!
      </p>
      <div className='flex flex-col w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10 mx-auto'>
        <div className='grid grid-flow-col grid-cols-6 grid-rows-1 gap-4 mb-3'>
          {loading
            ? <Loader />
            : data?.searchPlayers?.map(player => (
              <Link key={player.id} href={`/player/${player.id}`} passHref>
                <a title={player.name}><Avatar uuid={player.id} width='48' height='48' /></a>
              </Link>
            ))}
        </div>
        <PlayerSelector
          multiple={false}
          onChange={(id) => id ? router.push(`/player/${id}`) : undefined}
          placeholder='Search by player name'
        />
      </div>
    </div>
  )
}

export default SearchPanel
