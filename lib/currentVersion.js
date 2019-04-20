import { version } from 'package.json'

export default function currentVersion () {
  let versionStr

  if (GIT_TAG && GIT_TAG !== 'unknown') versionStr = GIT_TAG
  if (GIT_COMMIT && GIT_COMMIT !== 'unknown') versionStr = GIT_COMMIT
  if (!versionStr) versionStr = version

  return versionStr
}
