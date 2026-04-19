import { useRouter } from 'next/router'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useApi } from '../../utils'
import PlayerSelector from '../admin/PlayerSelector'
import Loader from '../Loader'
import Avatar from '../Avatar'
import PageHeader from '../PageHeader'
import Panel from '../Panel'

const SearchPanel = () => {
  const t = useTranslations()
  const router = useRouter()
  const query = `query searchPlayers($name: String!, $limit: Int!) {
    searchPlayers(name: $name, limit: $limit) {
      id
      name
    }
  }`

  const { loading, data } = useApi({ query, variables: { limit: 6, name: '' } })

  return (
    <Panel>
      <PageHeader title={t('pages.home.search.title')} subTitle={t('pages.home.search.subtitle')} />
      <p className='flex items-center mb-6'>
        {t('pages.home.search.intro')}
      </p>
      <div className='flex flex-col w-full max-w-md px-4 sm:px-6 md:px-8 lg:px-10 mx-auto mt-auto'>
        <div className='grid grid-flow-col grid-cols-6 grid-rows-1 gap-4 mb-3'>
          {loading
            ? <Loader />
            : data?.searchPlayers?.map(player => (
              <Link
                key={player.id}
                href={`/player/${player.id}`}
                passHref
                title={player.name}
              >
                <Avatar uuid={player.id} width='48' height='48' />
              </Link>
            ))}
        </div>
      </div>
      <PlayerSelector
        className='md:mt-auto mt-3'
        multiple={false}
        onChange={(id) => id ? router.push(`/player/${id}`) : undefined}
        placeholder={t('pages.home.search.placeholder')}
      />
    </Panel>
  )
}

export default SearchPanel
