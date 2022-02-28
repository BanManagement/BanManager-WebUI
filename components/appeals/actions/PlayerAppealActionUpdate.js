import { useRef, useState } from 'react'
import { FaPencilAlt } from 'react-icons/fa'
import Button from '../../Button'
import Modal from '../../Modal'
import PlayerBanForm from '../../PlayerBanForm'
import PlayerMuteForm from '../../PlayerMuteForm'
import PlayerWarnForm from '../../PlayerWarnForm'

export default function PlayerAppealActionUpdate ({ appeal, title, type, query, onUpdated }) {
  const [open, setOpen] = useState(false)
  const submitRef = useRef(null)

  const showConfirmDelete = (e) => {
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
        title={`Edit ${type}`}
        confirmButton={title}
        open={open}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {
          {
            ban:
  <PlayerBanForm
    serverFilter={s => s.id === appeal.server.id}
    defaults={{ reason: appeal.punishmentReason, expires: appeal.punishmentExpires }}
    disableServers
    query={query}
    submitRef={submitRef}
    parseVariables={(input) => ({
      id: appeal.id,
      input: {
        reason: input.reason,
        expires: Math.floor(input.expires / 1000)
      }
    })}
    onFinished={({ resolveAppealUpdateBan }) => {
      setOpen(false)
      onUpdated(resolveAppealUpdateBan)
    }}
  />,
            mute:
  <PlayerMuteForm
    serverFilter={s => s.id === appeal.server.id}
    defaults={{ reason: appeal.punishmentReason, expires: appeal.punishmentExpires, soft: appeal.punishmentSoft }}
    disableServers
    query={query}
    submitRef={submitRef}
    parseVariables={(input) => ({
      id: appeal.id,
      input: {
        reason: input.reason,
        expires: Math.floor(input.expires / 1000),
        soft: input.soft
      }
    })}
    onFinished={({ resolveAppealUpdateMute }) => {
      setOpen(false)
      onUpdated(resolveAppealUpdateMute)
    }}
  />,
            warning:
  <PlayerWarnForm
    serverFilter={s => s.id === appeal.server.id}
    query={query}
    submitRef={submitRef}
    parseVariables={(input) => ({
      id: appeal.id,
      input: {
        player: appeal.player.id,
        server: input.server,
        reason: input.reason,
        expires: Math.floor(input.expires / 1000),
        points: input.points
      }
    })}
    onFinished={({ resolveAppealUpdateWarning }) => {
      setOpen(false)
      onUpdated(resolveAppealUpdateWarning)
    }}
  />
          }[type]
        }
      </Modal>
      <Button onClick={showConfirmDelete}>
        <FaPencilAlt className='text-xl mr-2' /> {title}
      </Button>
    </>
  )
}
