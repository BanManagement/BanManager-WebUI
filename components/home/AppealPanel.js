import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Button from '../Button'
import PageHeader from '../PageHeader'
import Panel from '../Panel'
import { useUser } from '../../utils'

const AppealPanel = () => {
  const t = useTranslations()
  const { user } = useUser()

  return (
    <Panel>
      <PageHeader title={t('pages.home.appeal.title')} subTitle={t('pages.home.appeal.subtitle')} />
      <p className='flex mb-6'>
        {t('pages.home.appeal.intro')}
      </p>
      <p className='mb-3'>{t('pages.home.appeal.warning')}</p>
      <Link href={user ? '/appeal/punishment' : '/appeal'} passHref className='mt-auto'>
        <Button>
          {t('pages.home.appeal.cta')}
        </Button>
      </Link>
    </Panel>
  )
}

export default AppealPanel
