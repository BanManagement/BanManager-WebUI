import React from 'react'
import DefaultLayout from '../components/DefaultLayout'
import { Container, Header } from 'semantic-ui-react'

class Error extends React.Component {
  static async getInitialProps ({ res, err }) {
    const statusCode = res ? res.statusCode : err ? err.statusCode : null

    return { statusCode }
  }

  heading = ({ mobile }) => {
    return (
      <Container text>
        <Header
          as='h1'
          content='An error occurred'
          inverted
          style={{
            fontSize: mobile ? '2em' : '4em',
            fontWeight: 'normal',
            marginBottom: 0,
            marginTop: '1.5em'
          }}
        />
        <Header
          as='h2'
          content='Please try again later or go back'
          inverted
          style={{
            fontSize: mobile ? '1.5em' : '1.7em',
            fontWeight: 'normal',
            marginTop: mobile ? '0.5em' : '1.5em'
          }}
        />
      </Container>)
  }

  render () {
    return (
      <DefaultLayout title='Error' heading={this.heading} />
    )
  }
}

export default Error
