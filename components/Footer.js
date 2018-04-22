import React from 'react'
import { List, Responsive } from 'semantic-ui-react'
import { version } from 'package.json'

export default function Footer() {
  let versionStr

  if (GIT_TAG && GIT_TAG !== 'unknown') versionStr = GIT_TAG
  if (GIT_COMMIT && GIT_COMMIT !== 'unknown') versionStr = GIT_COMMIT
  if (!versionStr) versionStr = version

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
