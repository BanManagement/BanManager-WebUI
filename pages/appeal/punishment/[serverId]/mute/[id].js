import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTranslations } from 'next-intl'
import DefaultLayout from '../../../../../components/DefaultLayout'
import PageContainer from '../../../../../components/PageContainer'
import ErrorLayout from '../../../../../components/ErrorLayout'
import PlayerAppealForm from '../../../../../components/appeal/PlayerAppealForm'
import { useApi, useUser } from '../../../../../utils'
import Panel from '../../../../../components/Panel'
import AppealStepHeader from '../../../../../components/appeal/AppealStepHeader'
import Button from '../../../../../components/Button'

export default function Page () {
  const t = useTranslations()
  const router = useRouter()
  const { hasServerPermission } = useUser({ redirectIfFound: false, redirectTo: '/' })

  const { id, serverId } = router.query
  const canUpload = hasServerPermission('player.appeals', 'attachment.create', serverId)
  const { loading, data, errors } = useApi({
    query: !serverId || !id
      ? null
      : `query playerMute($id: ID!, $serverId: ID!) {
    playerMute(id: $id, serverId: $serverId) {
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
    if (data?.playerMute && !data.playerMute.acl.yours) {
      router.push('/')
    }
  }, [data])

  if (errors) return <ErrorLayout errors={errors} />

  return (
    <DefaultLayout title={t('pages.appeal.appealMuteDocument')} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={3} title={t('pages.appeal.appealMute')} nextStep={t('pages.appeal.stepHeader.awaitReview')} />
          {!loading && !data?.playerMute && (
            <div>
              <h2 className='text-center text-base font-semibold leading-relaxed pb-1'>{t('pages.appeal.punishmentNotFound')}</h2>
              <p className='text-center text-sm font-normal leading-snug pb-4'>{t('pages.appeal.headBack')}</p>
              <div className='flex gap-3'>
                <Button onClick={() => router.back()}>{t('common.back')}</Button>
              </div>
            </div>
          )}
          {data?.playerMute && <PlayerAppealForm
            {...data?.playerMute}
            type='mute'
            canUpload={canUpload}
            parseVariables={(input) => ({ input: { reason: input.reason, type: 'PlayerMute', serverId, punishmentId: id } })}
            onFinished={({ createAppeal }) => {
              router.push(`/appeals/${createAppeal.id}`)
            }}
                               />}
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
