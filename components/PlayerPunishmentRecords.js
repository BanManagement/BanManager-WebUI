import { useState } from 'react'
import { Dropdown, Header, Image, Loader, Pagination, Table } from 'semantic-ui-react'
import { format, fromUnixTime, formatDistance } from 'date-fns'
import ServerSelector from './admin/ServerSelector'
import { useApi } from '../utils'

const query = `
  query listPlayerPunishmentRecords($serverId: ID!, $player: UUID!, $type: RecordType!, $limit: Int, $offset: Int) {
    listPlayerPunishmentRecords(serverId: $serverId, player: $player, type: $type, limit: $limit, offset: $offset) {
      total
      records {
        ?
      }
      server {
        id
        name
      }
    }
  }`

const types = {
  PlayerBanRecord: `... on PlayerBanRecord {
    id
    actor {
      id
      name
    }
    pastActor {
      id
      name
    }
    created
    pastCreated
    reason
    expired
    acl {
      delete
    }
  }`,
  PlayerKick: `... on PlayerKick {
    id
    actor {
      id
      name
    }
    created
    reason
    acl {
      delete
    }
  }`,
  PlayerMuteRecord: `... on PlayerMuteRecord {
    id
    actor {
      id
      name
    }
    pastActor {
      id
      name
    }
    created
    pastCreated
    reason
    expired
    acl {
      delete
    }
  }`,
  PlayerNote: `... on PlayerNote {
    id
    actor {
      id
      name
    }
    created
    message
    acl {
      delete
    }
  }`,
  PlayerWarning: `... on PlayerWarning {
    id
    actor {
      id
      name
    }
    created
    reason
    expires
    acl {
      delete
    }
  }`
}

const PlayerBanRecordTable = (rows, dateFormat) => {
  return {
    headers:
  <Table.Row>
    <Table.HeaderCell>Reason</Table.HeaderCell>
    <Table.HeaderCell>By</Table.HeaderCell>
    <Table.HeaderCell>On</Table.HeaderCell>
    <Table.HeaderCell>Length</Table.HeaderCell>
    <Table.HeaderCell>Unbanned By</Table.HeaderCell>
    <Table.HeaderCell>At</Table.HeaderCell>
  </Table.Row>,
    body: rows.map((row, i) => (
      <Table.Row key={i}>
        <Table.Cell>{row.reason}</Table.Cell>
        <Table.Cell>
          <a href={`player/${row.pastActor.id}`}>
            <Image src={`https://crafatar.com/avatars/${row.pastActor.id}?size=26&overlay=true`} fluid avatar />
            {row.pastActor.name}
          </a>
        </Table.Cell>
        <Table.Cell>{format(fromUnixTime(row.pastCreated), dateFormat)}</Table.Cell>
        <Table.Cell>{row.expired === 0 ? 'Permanent' : formatDistance(0, row.expired * 1000, { includeSeconds: true })}</Table.Cell>
        <Table.Cell>
          <a href={`player/${row.actor.id}`}>
            <Image src={`https://crafatar.com/avatars/${row.actor.id}?size=26&overlay=true`} fluid avatar />
            {row.actor.name}
          </a>
        </Table.Cell>
        <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      </Table.Row>
    ))
  }
}

const PlayerKickTable = (rows, dateFormat) => {
  return {
    headers:
  <Table.Row>
    <Table.HeaderCell>Reason</Table.HeaderCell>
    <Table.HeaderCell>By</Table.HeaderCell>
    <Table.HeaderCell>At</Table.HeaderCell>
  </Table.Row>,
    body: rows.map((row, i) => (
      <Table.Row key={i}>
        <Table.Cell>{row.reason}</Table.Cell>
        <Table.Cell>
          <a href={`player/${row.actor.id}`}>
            <Image src={`https://crafatar.com/avatars/${row.actor.id}?size=26&overlay=true`} fluid avatar />
            {row.actor.name}
          </a>
        </Table.Cell>
        <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      </Table.Row>
    ))
  }
}

const PlayerNoteTable = (rows, dateFormat) => {
  return {
    headers:
  <Table.Row>
    <Table.HeaderCell>Message</Table.HeaderCell>
    <Table.HeaderCell>By</Table.HeaderCell>
    <Table.HeaderCell>At</Table.HeaderCell>
  </Table.Row>,
    body: rows.map((row, i) => (
      <Table.Row key={i}>
        <Table.Cell>{row.message}</Table.Cell>
        <Table.Cell>
          <a href={`player/${row.actor.id}`}>
            <Image src={`https://crafatar.com/avatars/${row.actor.id}?size=26&overlay=true`} fluid avatar />
            {row.actor.name}
          </a>
        </Table.Cell>
        <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      </Table.Row>
    ))
  }
}

const PlayerWarningTable = (rows, dateFormat) => {
  return {
    headers:
  <Table.Row>
    <Table.HeaderCell>Reason</Table.HeaderCell>
    <Table.HeaderCell>By</Table.HeaderCell>
    <Table.HeaderCell>Length</Table.HeaderCell>
    <Table.HeaderCell>At</Table.HeaderCell>
  </Table.Row>,
    body: rows.map((row, i) => (
      <Table.Row key={i}>
        <Table.Cell>{row.reason}</Table.Cell>
        <Table.Cell>
          <a href={`player/${row.actor.id}`}>
            <Image src={`https://crafatar.com/avatars/${row.actor.id}?size=26&overlay=true`} fluid avatar />
            {row.actor.name}
          </a>
        </Table.Cell>
        <Table.Cell>{row.expires === 0 ? 'Permanent' : formatDistance(0, row.expires * 1000, { includeSeconds: true })}</Table.Cell>
        <Table.Cell>{format(fromUnixTime(row.created), dateFormat)}</Table.Cell>
      </Table.Row>
    ))
  }
}

const views = {
  PlayerBanRecord: PlayerBanRecordTable,
  PlayerMuteRecord: PlayerBanRecordTable,
  PlayerKick: PlayerKickTable,
  PlayerNote: PlayerNoteTable,
  PlayerWarning: PlayerWarningTable
}

export default function PlayerPunishmentRecords ({ id }) {
  const limit = 20
  const [tableState, setTableState] = useState({ activePage: 1, limit, offset: 0, serverId: null, player: id, type: 'PlayerBanRecord' })
  const { loading, data, errors } = useApi({ query: !tableState.serverId ? null : query.replace('?', types[tableState.type]), variables: { ...tableState } })

  const handlePageChange = (e, { activePage }) => setTableState({ ...tableState, activePage, offset: (activePage - 1) * limit })
  const handleFieldChange = (field) => (id) => setTableState({ ...tableState, [field]: id || null })
  const total = data?.listPlayerPunishmentRecords.total || 0
  const rows = data?.listPlayerPunishmentRecords?.records || []
  const totalPages = Math.ceil(total / limit)
  const dateFormat = 'yyyy-MM-dd HH:mm:ss'

  if (errors) return null

  const options = Object.keys(views).map(option => ({
    key: option, text: option, value: option
  }))
  const view = views[tableState.type](rows, dateFormat)

  return (
    <>
      <Header>Punishment History</Header>
      <Table selectable structured striped>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>
              <Dropdown
                fluid
                options={options}
                onChange={(e, { value }) => handleFieldChange('type')(value)}
                disabled={loading}
                loading={loading}
                selectOnBlur={false}
                defaultValue={options.length ? options[0].value : null}
              />
            </Table.HeaderCell>
            <Table.HeaderCell colSpan='10'><ServerSelector handleChange={handleFieldChange('serverId')} /></Table.HeaderCell>
          </Table.Row>
          {view.headers}
        </Table.Header>
        <Table.Body>
          {loading ? <Table.Row><Table.Cell><Loader active inline='centered' /></Table.Cell></Table.Row> : view.body}
        </Table.Body>
        <Table.Footer>
          <Table.Row>
            <Table.HeaderCell colSpan='6'>
              <Pagination
                fluid
                totalPages={totalPages}
                activePage={tableState.activePage}
                onPageChange={handlePageChange}
              />
            </Table.HeaderCell>
          </Table.Row>
        </Table.Footer>
      </Table>
    </>
  )
}
