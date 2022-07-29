import { AiOutlinePlus } from 'react-icons/ai'
import { TiTick } from 'react-icons/ti'
import { upperFirst } from 'lodash-es'
import Message from '../../components/Message'
import AdminLayout from '../../components/AdminLayout'
import { currentVersion } from '../../utils'

export async function getStaticProps () {
  const version = currentVersion()

  let latestVersion = 'unknown'
  let response

  if (/\b([a-f0-9]{40})\b/.test(version)) {
    response = await fetch(`https://api.github.com/repos/BanManagement/BanManager-WebUI/compare/${version}...master`)
  } else {
    response = await fetch('https://api.github.com/repos/BanManagement/BanManager-WebUI/commits/master')
  }

  const data = await response.json()

  if (data?.commits?.length) {
    latestVersion = data.commits[data.commits.length - 1].sha
  }

  const newFeatures = data.commits.filter(({ commit }) => commit.message.startsWith('feat:'))
  const fixes = data.commits.filter(({ commit }) => commit.message.startsWith('fix:'))

  return { props: { latestVersion, version, newFeatures, fixes }, revalidate: 3600 }
}

const formatCommitMessage = (message) => upperFirst(
  message
    .replace('feat:', '')
    .replace('fix:', '')
    .replace(/\(#\d+\)/, '')
    .trim()
)

function Page ({ latestVersion, version, newFeatures, fixes }) {
  const features = newFeatures?.map(item => (
    <Message.Item key={item.sha}>
      <AiOutlinePlus className='text-xl inline' /> {formatCommitMessage(item.commit.message)}
    </Message.Item>
  ))
  const bugFixes = fixes?.map(item => (
    <Message.Item key={item.sha}>
      <TiTick className='text-xl inline' /> {formatCommitMessage(item.commit.message)}
    </Message.Item>
  ))

  return (
    <AdminLayout title='Admin'>
      {process.env.IS_DEV &&
        <Message warning>
          <Message.Header>Developer Mode</Message.Header>
          <Message.List>
            <Message.Item>You are currently running in development mode, expect performance degradation</Message.Item>
          </Message.List>
        </Message>}
      {version !== latestVersion &&
        <Message info>
          <Message.Header>Update Available</Message.Header>
          <Message.List>
            <Message.Item>Current version: {version.slice(0, 7)}<br />Latest: {latestVersion.slice(0, 7)}</Message.Item>
            {!!newFeatures?.length &&
              <>
                <Message.Item className='font-bold text-sm'>New Features</Message.Item>
                {features}
              </>}
            {!!fixes?.length &&
              <>
                <Message.Item className='font-bold text-sm'>Fixes</Message.Item>
                {bugFixes}
              </>}
          </Message.List>
        </Message>}
    </AdminLayout>
  )
}

export default Page
