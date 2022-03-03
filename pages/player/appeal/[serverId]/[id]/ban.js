import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Loader from '../../../../../components/Loader'
import DefaultLayout from '../../../../../components/DefaultLayout'
import PageContainer from '../../../../../components/PageContainer'
import ErrorLayout from '../../../../../components/ErrorLayout'
import PageHeader from '../../../../../components/PageHeader'
import PlayerAppealForm from '../../../../../components/PlayerAppealForm'
import { fromNow, useApi, useUser } from '../../../../../utils'

export default function Page () {
  const router = useRouter()

  useUser({ redirectIfFound: false, redirectTo: '/' })

  const { id, serverId } = router.query
  const { loading, data, errors } = useApi({
    query: !serverId || !id
      ? null
      : `query playerBan($id: ID!, $serverId: ID!) {
    playerBan(id: $id, serverId: $serverId) {
      id
      reason
      expires
      created
      actor {
        id
        name
      }
      server {
        id
        name
      }
      acl {
        yours
      }
    }

  }`,
    variables: { id, serverId }
  })

  useEffect(() => {
    if (data?.playerBan && !data.playerBan.acl.yours) {
      router.push('/')
    }
  }, [data])

  if (loading) return <DefaultLayout title='Appeal Ban'><Loader /></DefaultLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  return (
    <DefaultLayout title='Appeal Ban'>
      <PageContainer>
        <div className='mx-auto flex flex-col w-full max-w-md px-4 py-8 sm:px-6 md:px-8 lg:px-10 text-center md:border-2 md:rounded-lg md:border-black'>
          <PageHeader title='Appeal ban' subTitle={`Created ${fromNow(data.playerBan.created)}`} />
          <PlayerAppealForm
            {...data.playerBan}
            parseVariables={(input) => ({ input: { reason: input.reason, type: 'PlayerBan', serverId, punishmentId: id } })}
            onFinished={({ createAppeal }) => {
              router.push(`/appeals/${createAppeal.id}`)
            }}
          />
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}
