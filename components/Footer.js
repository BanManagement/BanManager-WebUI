import React from 'react'
import { List, Responsive } from 'semantic-ui-react'
import currentVersion from 'lib/currentVersion'

export default function Footer() {
  const versionStr = currentVersion()

  return (
    <React.Fragment>
      <List horizontal inverted divided link>
        <List.Item as='a' href='#'>&copy; Server Name Here</List.Item>
        <List.Item as='a' href='#'>Contact Us</List.Item>
        <List.Item as='a' href='#'>Link Example</List.Item>
      </List>
      <Responsive
        minWidth={Responsive.onlyTablet.minWidth}
        as={List}
        floated='right'
        horizontal>
          <List.Item as='a' href='https://github.com/BanManagement/BanManager-WebUI' floated='right'>v{versionStr}</List.Item>
      </Responsive>
    </React.Fragment>
  )
}
