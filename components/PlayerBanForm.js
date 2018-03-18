import React from 'react'
import {
  Button,
  Form,
  Image,
  Segment,
  Select
} from 'semantic-ui-react'
import Moment from 'react-moment'
import PropTypes from 'prop-types'
import DateTimePicker from 'components/DateTimePicker'
import GraphQLErrorMessage from './GraphQLErrorMessage'

class PlayerBanForm extends React.Component {
  handleChange = (e, { name, value }) => this.setState({ [name]: value })

  toggleExpiry = (e) => {
    e.preventDefault()

    let expiryType
    let expires

    if (this.state.expiryType === 'permanent') {
      expiryType = 'temporary'
      expires = Math.floor(Date.now() / 1000)
    } else {
      expiryType = 'permanent'
      expires = 0
    }

    this.setState({ expiryType, expires })
  }

  onExpiryChange = dateTime => this.setState({ expires: dateTime.unix() })

  disablePast = (current) => {
    return current.isAfter(new Date())
  }

  constructor(props) {
    super(props)

    const { data: { id, created, reason, expires, player } } = props
    let servers = null

    if (player && player.servers) {
      servers = player.servers.reduce((filtered, { acl, server }) => {
        if (acl.bans.create) {
          filtered.push({ key: server.id, value: server.id, text: server.name })
        }

        return filtered
      }, [])
    }

    this.state =
    { id
    , player: player
    , reason: reason || ''
    , created
    , expires: expires || 0
    , error: null
    , server: servers && servers.length ? servers[0].value : null
    , loading: false
    , servers
    , expiryType: expires ? 'temporary' : 'permanent'
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
    const { created, expires, reason, player, servers, server, error, loading, expiryType } = this.state
    const expiryColour = expiryType === 'permanent' ? 'red' : 'yellow'
    const expiryLabel = expiryType === 'permanent' ? 'Permanent' : 'Temporary'

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
            placeholder='Reason'
            value={reason}
            name='reason'
            onChange={this.handleChange}
          />
          <Form.Group inline>
            <label>Expires</label>
            <Button color={expiryColour} onClick={this.toggleExpiry}>{expiryLabel}</Button>
            {expires !== 0 &&
              <DateTimePicker
                value={expires * 1000}
                utc
                isValidDate={this.disablePast}
                onChange={this.onExpiryChange}
              />
            }
          </Form.Group>
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

PlayerBanForm.propTypes = {
  onSubmit: PropTypes.func.required
, data: PropTypes.object.required
}

export default PlayerBanForm
