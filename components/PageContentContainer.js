import React from 'react'
import { Container } from 'semantic-ui-react'

export default function PageContentContainer ({ children }) {
  return <Container
    style={{ marginTop: '1em', display: 'flex', minHeight: '100vh', flexDirection: 'column' }}
  >
    {children}
  </Container>
}
