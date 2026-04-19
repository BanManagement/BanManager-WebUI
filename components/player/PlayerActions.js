import { AiOutlineWarning } from 'react-icons/ai'
import { BsMicMute } from 'react-icons/bs'
import { FaBan, FaStickyNote } from 'react-icons/fa'
import { useUser } from '../../utils'
import Link from 'next/link'
import Button from '../Button'

export default function PlayerActions ({ id }) {
  const { hasServerPermission } = useUser()
  const canCreateBan = hasServerPermission('player.bans', 'create', null, true)
  const canCreateMute = hasServerPermission('player.mutes', 'create', null, true)
  const canCreateWarning = hasServerPermission('player.warnings', 'create', null, true)
  const canCreateNote = hasServerPermission('player.notes', 'create', null, true)

  if (!canCreateBan && !canCreateMute && !canCreateWarning && !canCreateNote) return null

  return (
    <div className='grid grid-cols-4 gap-4 text-center pt-4' data-cy='player-actions'>
      <div>
        {canCreateBan &&
          <Link href={`/player/${id}/ban`} passHref>
            <Button data-cy='action-ban' className='btn-outline'><FaBan className='text-red-800 mr-1' /> Ban</Button>
          </Link>}
      </div>
      <div>
        {canCreateMute &&
          <Link href={`/player/${id}/mute`} passHref>
            <Button data-cy='action-mute' className='btn-outline'><BsMicMute className='text-indigo-800 mr-1' /> Mute</Button>
          </Link>}
      </div>
      <div>
        {canCreateWarning &&
          <Link href={`/player/${id}/warn`} passHref>
            <Button data-cy='action-warn' className='btn-outline'><AiOutlineWarning className='text-amber-800 mr-1' /> Warn</Button>
          </Link>}
      </div>
      <div>
        {canCreateNote &&
          <Link href={`/player/${id}/note`} passHref>
            <Button data-cy='action-note' className='btn-outline'><FaStickyNote className='text-emerald-700 mr-1' /> Note</Button>
          </Link>}
      </div>
    </div>
  )
}
