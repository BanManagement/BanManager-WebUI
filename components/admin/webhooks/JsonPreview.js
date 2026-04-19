import fillTemplate from 'es6-dynamic-template'
import { useTranslations } from 'next-intl'

export default function DiscordPreview ({ json, variables }) {
  const t = useTranslations('pages.admin.webhooks')
  if (!json) return null

  let content = json

  if (variables) {
    content = fillTemplate(json, variables)
  }

  try {
    content = JSON.parse(content)
  } catch (e) {
    return <div className='text-red-500'>{t('invalidJson')}</div>
  }

  return (
    <pre>{JSON.stringify(content, null, 2)}</pre>
  )
}
