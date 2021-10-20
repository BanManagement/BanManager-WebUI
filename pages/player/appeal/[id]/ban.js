import { useEffect } from 'react'
import { Header, Loader } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import DefaultLayout from '../../../../components/DefaultLayout'
import PageContainer from '../../../../components/PageContainer'
import ErrorLayout from '../../../../components/ErrorLayout'
import { useApi, useUser } from '../../../../utils'
import PlayerAppealForm from '../../../../components/PlayerAppealForm'

export default function Page () {
  const router = useRouter()

  useUser({ redirectIfFound: false, redirectTo: '/' })

  const [serverId, id] = router.query.id?.split('-') || []
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

  if (loading) return <Loader active />
  if (errors || !data) return <ErrorLayout errors={errors} />

  return (
    <DefaultLayout title='Appeal Ban'>
      <PageContainer>
        <Header>Appeal Ban</Header>
        <PlayerAppealForm
          {...data.playerBan}
          parseVariables={(input) => ({ input: { reason: input.reason, type: 'PlayerBan', serverId, punishmentId: id } })}
          onFinished={({ createAppeal }) => {
            router.push(`/appeals/${createAppeal.id}`)
          }}
        />
      </PageContainer>
    </DefaultLayout>
  )
}
