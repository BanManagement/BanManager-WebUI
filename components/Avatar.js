import Image from 'next/image'
import { useEffect, useState } from 'react'

const Avatar = ({ height, width, scale = '6', uuid, className = '', type = 'avatar' }) => {
  const [error, setError] = useState(null)
  let url = 'https://crafatar.com/'

  if (type === 'avatar') {
    url += `avatars/${uuid}?size=${width}&overlay=true`
  } else if (type === 'body') {
    url += `renders/body/${uuid}?scale=${scale}&overlay=true`
  }

  let fallbackSrc = (process.env.BASE_PATH || '') + '/images/'
  fallbackSrc += type === 'avatar'
    ? 'steve-avatar-render.png'
    : 'steve-body-render.png'

  useEffect(() => {
    setError(null)
  }, [uuid])

  return (
    <Image
      width={width}
      height={height}
      onError={setError}
      src={error ? fallbackSrc : url}
      className={`${className} rounded-md`}
      alt={uuid}
    />
  )
}

export default Avatar
