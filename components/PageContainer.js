import { Container } from 'semantic-ui-react'

export default function PageContainer ({ children }) {
  return (
    <Container style={{ padding: '2em 0em', clear: 'both' }}>
      {children}
    </Container>
  )
}
