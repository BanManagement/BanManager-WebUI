import Avatar from '../Avatar'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'

const fullConfig = resolveConfig(tailwindConfig)

const PlayerAvatar = ({ id, colourData }) => {
  const backgroundStyle = {
    backgroundImage: `linear-gradient(${colourData.darkVibrant || fullConfig.theme.colors.accent['900']}, ${colourData.vibrant || fullConfig.theme.colors.accent['700']}, ${fullConfig.theme.colors.primary['500']})`,
    backgroundColor: fullConfig.theme.colors.accent['900']
  }

  return (
    <div className='text-center relative'>
      <Avatar className='z-20 scale-x-[-1]' scale='10' uuid={id} type='body' height='365' width='161' />
      <div className='absolute top-0 right-0 h-full w-full'>
        <div className='block absolute top-0 left-0 bottom-0 right-0 z-10'>
          <div className='block absolute bottom-0 w-1/2 h-3/4 left-1/2 ml-2 -translate-x-1/2 -skew-x-20 before:contents before:absolute before:top-0 before:w-11/12 before:right-3 before:bottom-0 before:mix-blend-overlay before:bg-opacity-20 before:bg-black' style={backgroundStyle} />
          <div className='block absolute bottom-0 w-1/2 h-2/3 -translate-x-1/2 -skew-x-20 before:contents before:absolute before:top-0 before:w-11/12 before:left-5 before:bottom-0 before:mix-blend-overlay before:bg-opacity-20 before:bg-black' style={{ ...backgroundStyle, left: '45%' }} />
          <div className='block absolute bottom-0 w-5/12 h-full -translate-x-1/2 -skew-x-20 before:contents before:absolute before:top-0 before:w-1/2 before:right-1/2 before:bottom-0 before:mix-blend-overlay before:bg-opacity-20 before:bg-white' style={{ ...backgroundStyle, left: '55%' }} />
        </div>
      </div>
    </div>
  )
}

export default PlayerAvatar
