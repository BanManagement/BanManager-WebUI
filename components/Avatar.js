import Image from 'next/image'
import { useEffect, useState } from 'react'

const Avatar = ({ height, width, uuid, className = '', type = 'avatar' }) => {
  const [error, setError] = useState(null)
  let url = 'https://vzge.me/'

  if (type === 'avatar') {
    url += `face/${width}/${uuid}.png`
  } else if (type === 'body') {
    url += `full/${height}/${uuid}.png`
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
      unoptimized
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
