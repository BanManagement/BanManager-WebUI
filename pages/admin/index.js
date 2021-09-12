import { Message } from 'semantic-ui-react'
import AdminLayout from '../../components/AdminLayout'
import { currentVersion } from '../../utils'

export async function getStaticProps () {
  let latestVersion = 'unknown'
  const response = await fetch('https://api.github.com/repos/BanManagement/BanManager-WebUI/commits/master')
  const data = await response.json()

  latestVersion = data.sha

  return { props: { latestVersion }, revalidate: 3600 }
}

function Page ({ latestVersion }) {
  const version = currentVersion()

  return (
    <AdminLayout title='Admin'>
      {process.env.IS_DEV &&
        <Message warning>
          <Message.Header>Developer Mode</Message.Header>
          <Message.Content>You are currently running in development mode, expect performance degradation</Message.Content>
        </Message>}
      {version !== latestVersion &&
        <Message info>
          <Message.Header>Update Available</Message.Header>
          <Message.Content>Current version: {version}<br />Latest: {latestVersion}</Message.Content>
        </Message>}
    </AdminLayout>
  )
}

export default Page
