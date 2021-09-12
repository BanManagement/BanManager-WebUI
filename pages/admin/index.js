import { Message } from 'semantic-ui-react'
import compareVersions from 'compare-versions'
import AdminLayout from '../../components/AdminLayout'
import { currentVersion } from '../../utils'

let latestVersion
let latestVersionCheck = 0

function Page () {
  const devMode = !!GIT_COMMIT
  let outdated = false

  try {
    outdated = compareVersions(currentVersion, latestVersion) < 0
  } catch (e) {
  }

  return (
    <AdminLayout title='Admin'>
      {devMode &&
        <Message warning>
          <Message.Header>Developer Mode</Message.Header>
          <Message.Content>You are currently running in development mode, expect performance degradation</Message.Content>
        </Message>}
      {outdated &&
        <Message info>
          <Message.Header>Update Available</Message.Header>
          <Message.Content>Current version: {currentVersion}<br />Latest: {latestVersion}</Message.Content>
        </Message>}
    </AdminLayout>
  )
}

export default Page

export const getServerSideProps = async () => {
  // Cache the lookup so we're not always hitting GitHub
  if (!process.browser) {
    const expired = (Date.now() - latestVersionCheck) > 3600000 // 1 hour

    if (!latestVersion || expired) {
      const response = await fetch('https://api.github.com/repos/BanManagement/BanManager-WebUI/releases')
      const data = await response.json()

      latestVersion = data[0].tag_name
      latestVersionCheck = Date.now()
    }
  }

  return { props: { latestVersion } }
}
