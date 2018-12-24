import React from 'react'
import {
  Message
} from 'semantic-ui-react'
import currentVersion from 'lib/currentVersion'
import compareVersions from 'compare-versions'

export default class VersionChecker extends React.Component {
  static defaultProps = { version: currentVersion() }

  render() {
    const { version, latestVersion } = this.props
    let devMode = !!GIT_COMMIT
    let outdated = false

    try {
      outdated = compareVersions(version, latestVersion) < 0
    } catch (e) {
    }

    return (
      <React.Fragment>
        {devMode && <Message warning>
            <Message.Header>Developer Mode</Message.Header>
            <Message.Content>You are currently running in development mode, expect performance degradation</Message.Content>
          </Message>
        }
        {outdated && <Message info>
            <Message.Header>Update Available</Message.Header>
            <Message.Content>Current version: {version}<br />Latest: {latestVersion}</Message.Content>
          </Message>
        }
      </React.Fragment>
    )
  }
}
