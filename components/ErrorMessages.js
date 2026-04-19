import { forwardRef } from 'react'
import { useTranslations } from 'next-intl'
import Message from './Message'
import { uniqBy } from 'lodash-es'
import { translateGraphqlError } from '../utils/locale'

// eslint-disable-next-line react/display-name
const ErrorMessages = forwardRef(({
  error,
  fetchError,
  httpError,
  parseError,
  errors
}, ref) => {
  const t = useTranslations()

  return (
    <>
      {error && (
        <Message ref={ref} error>
          <Message.Header>{t('errors.header')}</Message.Header>
          <Message.List data-cy='errors'>
            <Message.Item>{translateGraphqlError(t, error)}</Message.Item>
          </Message.List>
        </Message>
      )}
      {fetchError && (
        <Message ref={ref} error>
          <Message.Header>{t('errors.fetchHeader')}</Message.Header>
          <Message.List>
            <Message.Item>{fetchError}</Message.Item>
          </Message.List>
        </Message>
      )}
      {httpError && (
        <Message ref={ref} error>
          <Message.Header>{t('errors.httpHeader', { status: httpError.status })}</Message.Header>
          {httpError.statusText && <Message.List><Message.Item>{httpError.statusText}</Message.Item></Message.List>}
        </Message>
      )}
      {parseError && (
        <Message ref={ref} error>
          <Message.Header>{t('errors.header')}</Message.Header>
          <Message.List>
            <Message.Item>{parseError}</Message.Item>
          </Message.List>
        </Message>
      )}
      {errors && (
        <Message ref={ref} error>
          <Message.Header>{t('errors.header')}</Message.Header>
          <Message.List data-cy='errors'>
            {uniqBy(errors, 'message').map((err, index) => (
              <Message.Item key={index}>{translateGraphqlError(t, err)}</Message.Item>
            ))}
          </Message.List>
        </Message>
      )}
    </>
  )
})

export default ErrorMessages
