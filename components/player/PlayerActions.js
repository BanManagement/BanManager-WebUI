import { AiOutlineWarning } from 'react-icons/ai'
import { BsMicMute } from 'react-icons/bs'
import { FaBan } from 'react-icons/fa'
import { useUser } from '../../utils'
import Link from 'next/link'
import Button from '../Button'
import { BiNotepad } from 'react-icons/bi'

export default function PlayerActions ({ id }) {
  const { hasServerPermission } = useUser()
  const canCreateBan = hasServerPermission('player.bans', 'create', null, true)
  const canCreateMute = hasServerPermission('player.mutes', 'create', null, true)
  const canCreateNote = hasServerPermission('player.notes', 'create', null, true)
  const canCreateWarning = hasServerPermission('player.warnings', 'create', null, true)

  if (!canCreateBan && !canCreateMute && !canCreateNote && !canCreateWarning) return null

  return (
    <div className="grid grid-cols-4 gap-4 text-center pt-4">
      <div>
        {canCreateBan && <Link href={`/player/${id}/ban`} passHref>
          <Button className='btn-outline'><FaBan className='text-red-800 mr-1' /> Ban</Button>
        </Link>}
      </div>
      <div>
        {canCreateMute && <Link href={`/player/${id}/mute`} passHref>
          <Button className='btn-outline'><BsMicMute className='text-indigo-800 mr-1' /> Mute</Button>
        </Link>}
      </div>
      <div>
        {canCreateNote && <Link href={`/player/${id}/note`} passHref>
          <Button className='btn-outline'><BiNotepad className='text-teal-800 mr-1' /> Note</Button>
        </Link>}
      </div>
      <div>
        {canCreateWarning && <Link href={`/player/${id}/warn`} passHref>
          <Button className='btn-outline'><AiOutlineWarning className='text-amber-800 mr-1' /> Warn</Button>
        </Link>}
      </div>
    </div>
  )
}
