import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Button from '../../components/Button'
import DefaultLayout from '../../components/DefaultLayout'
import PageContainer from '../../components/PageContainer'
import Panel from '../../components/Panel'
import AppealStepHeader from '../../components/appeal/AppealStepHeader'
import { MdOutlineEmail, MdPin } from 'react-icons/md'
import { useUser } from '../../utils'

function Page () {
  const t = useTranslations('pages.appeal')

  useUser({ redirectIfFound: true, redirectTo: '/appeal/punishment' })

  return (
    <DefaultLayout title={t('documentTitle')}>
      <PageContainer>
        <Panel className='mx-auto w-full max-w-md'>
          <AppealStepHeader step={1} title={t('stepHeader.step1')} nextStep={t('stepHeader.selectPunishment')} />
          <p className='mb-6'>{t('intro')}</p>
          <Link href='/appeal/pin'>
            <div className='flex gap-4'>
              <Button className='w-12 h-12'><MdPin /></Button>
              <div>
                <p className='underline'>{t('pinHelp')}<code>123456</code></p>
                <p className='text-sm text-gray-400'>
                  {t.rich('pinDescription', {
                    command: () => <code className='bg-primary-900'>/bmpin</code>
                  })}
                </p>
                <p className='text-sm text-gray-400 mt-2'>{t('pinExpiry')}</p>
              </div>
            </div>
          </Link>
          <div className='inline-flex items-center justify-center w-full'>
            <hr className='w-full h-px my-8 bg-primary-900 border-0 ' />
            <span className='absolute px-3 font-medium bg-primary-500 -translate-x-1/2  left-1/2'>{t('or')}</span>
          </div>
          <Link href='/appeal/account'>
            <div className='flex gap-4'>
              <Button className='w-12 h-12'><MdOutlineEmail /></Button>
              <div>
                <p className='underline'>{t('haveAccount')}</p>
                <p className='text-sm text-gray-400'>{t('haveAccountDescription')}</p>
              </div>
            </div>
          </Link>
        </Panel>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Page
