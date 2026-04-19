import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { mutate } from 'swr'
import { MdLanguage } from 'react-icons/md'
import Dropdown from './Dropdown'
import Button from './Button'
import { useUser } from '../utils'
import {
  LOCALE_CONFIG,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  useResolvedLocale
} from '../utils/locale'

const setLocaleMutation = `
  mutation setLocale($locale: String!) {
    setLocale(locale: $locale) {
      id
      locale
    }
  }
`

export default function LanguageSwitcher ({ buttonClassName = '', variant = 'icon' }) {
  const t = useTranslations('widgets.languageSwitcher')
  const { user } = useUser()
  const { locale, setLocale } = useResolvedLocale()
  const [updating, setUpdating] = useState(false)

  const persistRemoteLocale = async (next) => {
    const response = await fetch((process.env.BASE_PATH || '') + '/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query: setLocaleMutation,
        variables: { locale: next }
      })
    })

    if (!response.ok) {
      throw new Error(`setLocale request failed with status ${response.status}`)
    }

    const json = await response.json().catch(() => ({}))

    if (json.errors?.length) {
      throw new Error(json.errors[0]?.message || 'setLocale returned errors')
    }
  }

  const handleSelect = async (next) => {
    if (!isSupportedLocale(next) || next === locale || updating) return

    setUpdating(true)
    setLocale(next)

    try {
      if (user?.id) {
        await persistRemoteLocale(next)
        mutate('/api/user')
      }
    } catch (err) {
      console.error('Failed to persist locale preference', err)
    } finally {
      setUpdating(false)
    }
  }

  const currentConfig = LOCALE_CONFIG[locale] || LOCALE_CONFIG.en
  const triggerLabel = variant === 'inline' ? currentConfig.label : null

  return (
    <Dropdown
      trigger={({ onClickToggle }) => (
        <Button
          onClick={onClickToggle}
          className={buttonClassName}
          title={t('label')}
          aria-label={t('select')}
          disabled={updating}
          loading={updating}
        >
          <MdLanguage className={triggerLabel ? 'mr-2' : ''} />
          {triggerLabel}
        </Button>
      )}
    >
      {SUPPORTED_LOCALES.map((code) => {
        const config = LOCALE_CONFIG[code]
        const label = code === locale ? `${config.label} \u2713` : config.label

        return (
          <Dropdown.Item
            key={code}
            name={label}
            onClick={() => handleSelect(code)}
          />
        )
      })}
    </Dropdown>
  )
}
