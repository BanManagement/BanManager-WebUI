import Image from 'next/image'

const Avatar = ({ height, width, scale = '6', uuid, className = '', type = 'avatar' }) => {
  let url = 'https://crafatar.com/'

  if (type === 'avatar') {
    url += `avatars/${uuid}?size=${width}&overlay=true`
  } else if (type === 'body') {
    url += `renders/body/${uuid}?scale=${scale}&overlay=true`
  }

  return (
    <Image
      width={width}
      height={height}
      src={url}
      className={`${className} rounded-lg`}
    />
  )
}

export default Avatar
