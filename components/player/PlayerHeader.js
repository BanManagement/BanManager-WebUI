import Link from 'next/link'
import { BiNotepad } from 'react-icons/bi'
import { FaBan } from 'react-icons/fa'
import { BsMicMute } from 'react-icons/bs'
import { AiOutlineWarning } from 'react-icons/ai'
import ErrorMessages from '../ErrorMessages'
import Loader from '../Loader'
import Button from '../Button'
import { fromNow, useApi, useUser } from '../../utils'

export default function PlayerHeader ({ id, color }) {
  const { loading, data, errors } = useApi({
    variables: { id }, query: `
    query player($id: UUID!) {
      player(player: $id) {
        id
        name
        lastSeen
      }
    }
  `
  })
  const { hasServerPermission } = useUser()
  const canCreateBan = hasServerPermission('player.bans', 'create', null, true)
  const canCreateMute = hasServerPermission('player.mutes', 'create', null, true)
  const canCreateNote = hasServerPermission('player.notes', 'create', null, true)
  const canCreateWarning = hasServerPermission('player.warnings', 'create', null, true)

  if (loading) return <Loader />
  if (errors || !data) return <ErrorMessages errors={errors} />

  return (
    <div>
      <div className='border-b pb-4 flex gap-12' style={{ borderColor: color }}>
        <div>
          <h1 className='text-4xl font-bold pb-2 leading-none'>{data.player.name}</h1>
          <h2 className='text-xs tracking-widest title-font font-medium text-gray-400 uppercase'>{fromNow(data.player.lastSeen)}</h2>
        </div>
        <div className='hidden xl:flex gap-12'>
          {canCreateBan &&
            <Link href={`/player/${id}/ban`} passHref>
              <a>
                <Button><FaBan className='text-xl mr-2' /> Ban</Button>
              </a>
            </Link>}
          {canCreateMute &&
            <Link href={`/player/${id}/mute`} passHref>
              <a>
                <Button><BsMicMute className='text-xl mr-2' /> Mute</Button>
              </a>
            </Link>}
          {canCreateNote &&
            <Link href={`/player/${id}/note`} passHref>
              <a>
                <Button><BiNotepad className='text-xl mr-2' /> Note</Button>
              </a>
            </Link>}
          {canCreateWarning &&
            <Link href={`/player/${id}/warn`} passHref>
              <a>
                <Button><AiOutlineWarning className='text-xl mr-2' /> Warn</Button>
              </a>
            </Link>}
        </div>
      </div>
      <div className='xl:hidden grid grid-cols-2 mt-6 gap-6'>
        {canCreateBan &&
          <Link href={`/player/${id}/ban`} passHref>
            <a>
              <Button><FaBan className='text-xl mr-2' /> Ban</Button>
            </a>
          </Link>}
        {canCreateMute &&
          <Link href={`/player/${id}/mute`} passHref>
            <a>
              <Button><BsMicMute className='text-xl mr-2' /> Mute</Button>
            </a>
          </Link>}
        {canCreateNote &&
          <Link href={`/player/${id}/note`} passHref>
            <a>
              <Button><BiNotepad className='text-xl mr-2' /> Note</Button>
            </a>
          </Link>}
        {canCreateWarning &&
          <Link href={`/player/${id}/warn`} passHref>
            <a>
              <Button><AiOutlineWarning className='text-xl mr-2' /> Warn</Button>
            </a>
          </Link>}
      </div>
    </div>
  )
}
