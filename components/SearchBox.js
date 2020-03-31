import React from 'react'
import { Grid, Header, Image } from 'semantic-ui-react'
import { useRouter } from 'next/router'
import PlayerSelector from './admin/PlayerSelector'

export default function SearchBox ({ meta: { iconSrc, name, showPlayerSearch, showIpSearch } }) {
  const router = useRouter()

  return (
    <Grid columns={2} stackable textAlign='center'>
      <Grid.Row verticalAlign='middle'>
        <Grid.Column>
          <Header
            as='h1'
            icon
            inverted
          >
            {!!iconSrc && <Image src={iconSrc} />}
            <Header.Content>{name}</Header.Content>
          </Header>
        </Grid.Column>
        <Grid.Column textAlign='left'>
          {!!showPlayerSearch &&
            <PlayerSelector
              multiple={false}
              handleChange={(id) => id ? router.push(`/player/${id}`) : undefined}
              placeholder='Search Player Name'
            />}
          <br />
          {!!showIpSearch &&
            <PlayerSelector
              multiple={false}
              handleChange={(id) => id ? router.push(`/player/${id}`) : undefined}
              placeholder='Search IP Address'
            />}
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}
