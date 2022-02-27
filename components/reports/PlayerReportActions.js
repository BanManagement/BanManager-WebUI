import { useRef, useState } from 'react'
import { FaBan } from 'react-icons/fa'
import { BsMicMute } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'
import Button from '../Button'
import Modal from '../Modal'
import PlayerBanForm from '../PlayerBanForm'
import PlayerMuteForm from '../PlayerMuteForm'
import PlayerWarnForm from '../PlayerWarnForm'
import { useUser } from '../../utils'

const createQuery = (mutation, input) => `mutation ${mutation}($report: ID!, $serverId: ID!, $input: ${input}!) {
  ${mutation}(report: $report, serverId: $serverId, input: $input) {
    id
    state {
      id
      name
    }
    commands {
      id
      command
      args
      created
      actor {
        id
        name
      }
    }
    updated
  }
}`

const PunishmentAction = ({ children, type, report, server, onAction }) => {
  const [open, setOpen] = useState(false)
  const submitRef = useRef(null)
  const showConfirm = (e) => {
    e.preventDefault()

    setOpen(true)
  }
  const handleConfirm = async () => {
    submitRef?.current?.click()
  }
  const handleCancel = () => setOpen(false)

  return (
    <>
      <Modal
        title={`${type} ${report.player.name}`}
        confirmButton={type}
        open={open}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {
          {
            Ban:
  <PlayerBanForm
    serverFilter={s => s.id === server.id}
    query={createQuery('resolveReportBan', 'CreatePlayerBanInput')}
    submitRef={submitRef}
    parseVariables={(input) => ({
      report: report.id,
      serverId: server.id,
      input: {
        player: report.player.id,
        server: input.server,
        reason: input.reason,
        expires: Math.floor(input.expires / 1000)
      }
    })}
    onFinished={({ resolveReportBan }) => {
      setOpen(false)
      onAction(resolveReportBan)
    }}
  />,
            Mute:
  <PlayerMuteForm
    serverFilter={s => s.id === server.id}
    query={createQuery('resolveReportMute', 'CreatePlayerMuteInput')}
    submitRef={submitRef}
    parseVariables={(input) => ({
      report: report.id,
      serverId: server.id,
      input: {
        player: report.player.id,
        server: input.server,
        reason: input.reason,
        expires: Math.floor(input.expires / 1000),
        soft: input.soft
      }
    })}
    onFinished={({ resolveReportMute }) => {
      setOpen(false)
      onAction(resolveReportMute)
    }}
  />,
            Warn:
  <PlayerWarnForm
    serverFilter={s => s.id === server.id}
    query={createQuery('resolveReportWarning', 'CreatePlayerWarningInput')}
    submitRef={submitRef}
    parseVariables={(input) => ({
      report: report.id,
      serverId: server.id,
      input: {
        player: report.player.id,
        server: input.server,
        reason: input.reason,
        expires: Math.floor(input.expires / 1000),
        points: input.points
      }
    })}
    onFinished={({ resolveReportWarning }) => {
      setOpen(false)
      onAction(resolveReportWarning)
    }}
  />
          }[type]
        }
      </Modal>
      <a href='#' onClick={showConfirm}>
        {children}
      </a>
    </>
  )
}

export default function PlayerReportActions ({ report, server, onAction }) {
  const { hasServerPermission } = useUser()
  const canCreateBan = hasServerPermission('player.bans', 'create', server.id)
  const canCreateMute = hasServerPermission('player.mutes', 'create', server.id)
  const canCreateWarning = hasServerPermission('player.warnings', 'create', server.id)

  return (
    <div className='flex flex-col gap-8'>
      {canCreateBan &&
        <PunishmentAction
          type='Ban'
          report={report}
          server={server}
          onAction={onAction}
        >
          <Button><FaBan className='text-xl mr-2' /> Ban</Button>
        </PunishmentAction>}
      {canCreateMute &&
        <PunishmentAction
          type='Mute'
          report={report}
          server={server}
          onAction={onAction}
        >
          <Button><BsMicMute className='text-xl mr-2' /> Mute</Button>
        </PunishmentAction>}
      {canCreateWarning &&
        <PunishmentAction
          type='Warn'
          report={report}
          server={server}
          onAction={onAction}
        >
          <Button><AiOutlineWarning className='text-xl mr-2' /> Warn</Button>
        </PunishmentAction>}
    </div>
  )
}
