import { useTranslations } from 'next-intl'
import DefaultLayout from '../components/DefaultLayout'
import PageContainer from '../components/PageContainer'
import PageHeader from '../components/PageHeader'
import Panel from '../components/Panel'
import Link from 'next/link'
import Image from 'next/image'

function Error () {
  const t = useTranslations('pages.notFound')

  return (
    <DefaultLayout title={t('documentTitle')}>
      <PageContainer>
        <div className='flex flex-col-reverse md:flex-row items-center justify-center gap-10'>
          <div>
            <Image src={(process.env.BASE_PATH || '') + '/images/error.png'} alt={t('subtitle')} width='318' height='318' />
          </div>
          <Panel className='md:border-0'>
            <PageHeader subTitle={t('subtitle')} title={t('title')} />
            <div className='flex flex-col gap-4'>
              <p>{t('intro')}</p>
              <h3 className='font-semibold'>{t('directions')}</h3>
              <ol className='list-disc pl-3'>
                <li>
                  <Link href='/' className='text-accent-500'>{t('homepage')}</Link>{t('homepageHint')}
                </li>
                <li>
                  {t('search')}
                </li>
                <li>{t('back')}</li>
              </ol>
            </div>
          </Panel>
        </div>
      </PageContainer>
    </DefaultLayout>
  )
}

export default Error
