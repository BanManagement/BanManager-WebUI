import { AiOutlinePlus } from 'react-icons/ai'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import Loader from '../../../components/Loader'
import ErrorLayout from '../../../components/ErrorLayout'
import AdminLayout from '../../../components/AdminLayout'
import RoleItem from '../../../components/admin/RoleItem'
import Button from '../../../components/Button'
import PageHeader from '../../../components/PageHeader'
import PlayersTable from '../../../components/admin/PlayersTable'
import AssignPlayersRoleForm from '../../../components/admin/AssignPlayersRoleForm'
import { useApi } from '../../../utils'
import Message from '../../../components/Message'

export default function Page () {
  const t = useTranslations()
  const { loading, data, errors, mutate } = useApi({
    query: `query rolesAdminPage {
      roles {
        id
        name
      }
      servers {
        id
        name
      }
    }`
  })
  const onDeleted = ({ deleteRole: { id } }) => {
    const roles = data.roles.filter(s => s.id !== id)

    mutate({ ...data, roles }, false)
  }

  if (loading) return <AdminLayout title={t('pages.admin.loading')}><Loader /></AdminLayout>
  if (errors || !data) return <ErrorLayout errors={errors} />

  const items = data.roles.map(role => <RoleItem key={role.id} role={role} onDeleted={onDeleted} />)
  const globalRoleMutation = `mutation assignRole($players: [UUID!]!, $role: Int!) {
    assignRole(players: $players, role: $role) {
      id
    }
  }`
  const serverRoleMutation = `mutation assignRole($players: [UUID!]!, $serverId: ID!, $role: Int!) {
    assignServerRole(players: $players, serverId: $serverId, role: $role) {
      id
    }
  }`

  return (
    <AdminLayout title={t('pages.admin.roles.title')}>
      <PageHeader title={t('pages.admin.roles.title')} />
      <div className='w-24 mb-5'>
        <Link href='/admin/roles/add' passHref>

          <Button className='bg-emerald-600 hover:bg-emerald-700'><AiOutlinePlus className='text-xl' /> {t('common.add')}</Button>

        </Link>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 justify-items-center pb-12 border-b border-accent-200'>
        {items}
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 justify-items-center'>
        <div>
          <Message info>
            <Message.Header>{t('pages.admin.roles.tipsHeader')}</Message.Header>
            <Message.List>
              <Message.Item>{t('pages.admin.roles.tip1')}</Message.Item>
              <Message.Item>{t('pages.admin.roles.tip2')}</Message.Item>
              <Message.Item>{t('pages.admin.roles.tip3')}</Message.Item>
              <Message.Item>{t('pages.admin.roles.tip4')}</Message.Item>
            </Message.List>
          </Message>
        </div>
        <div data-cy='assign-global-role'>
          <PageHeader title={t('pages.admin.roles.assignGlobal')} />
          <p className='mb-6'>{t('pages.admin.roles.assignGlobalHint')}</p>
          <AssignPlayersRoleForm roles={data.roles} query={globalRoleMutation} />
        </div>
        <div data-cy='assign-server-role'>
          <PageHeader title={t('pages.admin.roles.assignServer')} />
          <p className='mb-6'>{t('pages.admin.roles.assignServerHint')}</p>
          <AssignPlayersRoleForm roles={data.roles} servers={data.servers} query={serverRoleMutation} />
        </div>
      </div>
      <div>
        <PlayersTable roles={data.roles} servers={data.servers} />
      </div>
    </AdminLayout>
  )
}
