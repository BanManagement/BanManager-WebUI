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
      : `query playerWarning($id: ID!, $serverId: ID!) {
    playerWarning(id: $id, serverId: $serverId) {
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
    if (data?.playerWarning && !data.playerWarning.acl.yours) {
      router.push('/')
    }
  }, [data])

  if (errors) return <ErrorLayout errors={errors} />

  return (
    <DefaultLayout title={t('pages.appeal.appealWarningDocument')} loading={loading}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={3} title={t('pages.appeal.appealWarning')} nextStep={t('pages.appeal.stepHeader.awaitReview')} />
          {!loading && !data?.playerWarning && (
            <div>
              <h2 className='text-center text-base font-semibold leading-relaxed pb-1'>{t('pages.appeal.punishmentNotFound')}</h2>
              <p className='text-center text-sm font-normal leading-snug pb-4'>{t('pages.appeal.headBack')}</p>
              <div className='flex gap-3'>
                <Button onClick={() => router.back()}>{t('common.back')}</Button>
              </div>
            </div>
          )}
          {data?.playerWarning && <PlayerAppealForm
            {...data?.playerWarning}
            type='warning'
            canUpload={canUpload}
            parseVariables={(input) => ({ input: { reason: input.reason, type: 'PlayerWarning', serverId, punishmentId: id } })}
            onFinished={({ createAppeal }) => {
              router.push(`/appeals/${createAppeal.id}`)
            }}
                                  />}
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}
