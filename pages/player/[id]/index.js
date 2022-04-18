import { usePalette } from '@universemc/react-palette'
import { NextSeo } from 'next-seo'
import { getApiRoot } from 'nextjs-url'
import DefaultLayout from '../../../components/DefaultLayout'
import { useUser } from '../../../utils'

import PlayerAlts from '../../../components/player/PlayerAlts'
import PlayerHeader from '../../../components/player/PlayerHeader'
import PlayerAvatar from '../../../components/player/PlayerAvatar'
import ActivePlayerBans from '../../../components/ActivePlayerBans'
import ActivePlayerMutes from '../../../components/ActivePlayerMutes'

import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../../tailwind.config'
import PlayerStatistics from '../../../components/player/PlayerStatistics'
import PlayerNotes from '../../../components/PlayerNotes'
import PlayerWarnings from '../../../components/PlayerWarnings'
import PlayerBans from '../../../components/PlayerBans'
import PlayerMutes from '../../../components/PlayerMutes'
import PlayerKicks from '../../../components/PlayerKicks'
import PlayerHistoryList from '../../../components/PlayerHistoryList'
import PageContainer from '../../../components/PageContainer'

const fullConfig = resolveConfig(tailwindConfig)

export async function getServerSideProps ({ req, params }) {
  const { isUUID } = require('validator')

  if (!isUUID(params.id)) return { notFound: true }

  const { parse, unparse } = require('uuid-parse')
  const id = parse(params.id, Buffer.alloc(16))
  const data = await req.loaders.player.load({ id, fields: ['id', 'name', 'lastseen'] })

  if (!data) return { notFound: true }

  const player = {
    ...data,
    id: unparse(data.id)
  }
  const baseUrl = getApiRoot(req).href

  return {
    props: {
      data: {
        player,
        ogImage: `${baseUrl}/opengraph/player/${player.id}`
      }
    }
  }
}

export default function Page ({ data }) {
  const { hasServerPermission } = useUser()
  const { data: colourData } = usePalette(!data?.player?.id ? null : `https://crafatar.com/renders/body/${data.player.id}?scale=10&overlay=true`)
  const color = colourData.vibrant || fullConfig.theme.colors.accent['500']

  return (
    <>
      <NextSeo
        openGraph={{
          title: data.player.name,
          images: [
            {
              url: data.ogImage,
              width: 1200,
              height: 600,
              alt: `${data.player.name} profile`
            }
          ]
        }}
        twitter={{
          cardType: 'summary_large_image'
        }}
      />
      <DefaultLayout title={data.player.name}>
        <PageContainer>
          <div className='grid grid-flow-row xl:grid-flow-col grid-cols-12'>
            <div className='col-span-12 xl:col-span-9 space-y-10'>
              <PlayerHeader id={data.player.id} color={color} colourData={colourData} />
              <PlayerStatistics id={data.player.id} color={color} colourData={colourData} />
              {hasServerPermission('player.alts', 'view', null, true) && <PlayerAlts id={data.player.id} color={color} />}
              <ActivePlayerBans id={data.player.id} color={color} />
              {hasServerPermission('player.bans', 'view', null, true) && <PlayerBans id={data.player.id} color={color} />}
              <ActivePlayerMutes id={data.player.id} color={color} />
              {hasServerPermission('player.mutes', 'view', null, true) && <PlayerMutes id={data.player.id} color={color} />}
              {hasServerPermission('player.kicks', 'view', null, true) && <PlayerKicks id={data.player.id} color={color} />}
              {hasServerPermission('player.notes', 'view', null, true) && <PlayerNotes id={data.player.id} color={color} />}
              {hasServerPermission('player.warnings', 'view', null, true) && <PlayerWarnings id={data.player.id} color={color} />}
            </div>
            <div className='hidden xl:block col-span-3 space-y-10'>
              <PlayerAvatar id={data.player.id} color={color} colourData={colourData} />
              {hasServerPermission('player.history', 'view', null, true) && <div className='mx-6'><PlayerHistoryList id={data.player.id} color={color} /></div>}
            </div>
          </div>
          <div className='xl:hidden col-span-12 space-y-10'>
            {hasServerPermission('player.history', 'view', null, true) && <PlayerHistoryList id={data.player.id} color={color} />}
          </div>
        </PageContainer>
      </DefaultLayout>
    </>
  )
}
