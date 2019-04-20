import React from 'react'
import {
  Form,
  Image,
  Segment,
  Select
} from 'semantic-ui-react'
import Moment from 'react-moment'
import GraphQLErrorMessage from './GraphQLErrorMessage'

class PlayerNoteForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  constructor(props) {
    super(props)

    const { data: { id, created, message, player } } = props
    let servers = null

    if (player && player.servers) {
      servers = player.servers.reduce((filtered, { acl, server }) => {
        if (acl.notes.create) {
          filtered.push({ key: server.id, value: server.id, text: server.name })
        }

        return filtered
      }, [])
    }

    this.state =
    { id
    , player: player
    , message: message || ''
    , created: created
    , error: null
    , server: servers && servers.length ? servers[0].value : null
    , loading: false
    , servers
    }
  }

  onSubmit = async (e) => {
    this.setState({ loading: true })

    try {
      await this.props.onSubmit(e, this.state)
    } catch (error) {
      this.setState({ error, loading: false })
    }
  }

  render() {
    const { created, message, player, servers, server, error, loading } = this.state

    return (
      <Form size='large' onSubmit={this.onSubmit} error loading={loading}>
        <Segment>
          <GraphQLErrorMessage error={error} />
          <Form.Group inline>
            <label><Image fluid inline src={`https://crafatar.com/avatars/${player.id}?size=50&overlay=true`} /></label>
            {player.name}
          </Form.Group>
          { servers &&
            <Form.Field
              required
              name='server'
              control={Select}
              options={servers}
              placeholder='Server'
              onChange={this.handleChange}
              defaultValue={server}
            />
          }
          <Form.Input
            fluid
            required
            placeholder='Message'
            value={message}
            name='message'
            onChange={this.handleChange}
          />
          {created &&
            <Form.Group inline>
              <label>Created</label><Moment unix fromNow>{created}</Moment>
            </Form.Group>
          }
          <Form.Button fluid primary size='large' content='Save' />
        </Segment>
      </Form>
    )
  }
}

export default PlayerNoteForm
