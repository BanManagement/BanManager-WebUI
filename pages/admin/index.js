import React from 'react'
import withData from 'lib/withData'
import AdminLayout from 'components/AdminLayout'
import VersionChecker from 'components/admin/VersionChecker'

let latestVersion
let latestVersionCheck = 0

export class AdminPage extends React.Component {
  static async getInitialProps () {
    // Cache the lookup so we're not always hitting GitHub
    if (!process.browser) {
      const expired = (Date.now() - latestVersionCheck) > 3600000 // 1 hour

      if (!latestVersion || expired) {
        latestVersion = await this.getReleaseVersion()
        latestVersionCheck = Date.now()
      }
    }

    return { latestVersion }
  }

  static async getReleaseVersion () {
    const response = await fetch('https://api.github.com/repos/BanManagement/BanManager-WebUI/releases')
    const data = await response.json()

    return data[0].tag_name
  }

  render () {
    return (
      <AdminLayout title='Admin' displayNavTitle>
        <VersionChecker latestVersion={this.props.latestVersion} />
      </AdminLayout>
    )
  }
}

export default withData(AdminPage)
