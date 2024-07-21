import Avatar from '../Avatar'
import resolveConfig from 'tailwindcss/resolveConfig'
import tailwindConfig from '../../tailwind.config'

const fullConfig = resolveConfig(tailwindConfig)

const PlayerAvatar = ({ id, colourData }) => {
  const backgroundStyle = {
    backgroundImage: `linear-gradient(-45deg, ${colourData.vibrant || fullConfig.theme.colors.accent['700']}, ${colourData.darkVibrant || fullConfig.theme.colors.accent['900']}, ${fullConfig.theme.colors.primary['500']})`,
    animation: 'gradient 5s ease infinite',
    backgroundSize: '400% 400%'
  }

  return (
    <div className='relative w-20 md:w-60 mx-auto md:mr-0'>
      <Avatar className='z-20 relative drop-shadow-[1rem_1rem_1rem_rgba(0,0,0,0.9)]' scale='5' uuid={id} type='body' height='225' width='100' />
      <div className='absolute hidden md:block top-0 left-0 h-full w-full'>
        <div className='block absolute top-0 left-0 bottom-0 right-0 z-10'>
          <div className='block rounded-3xl before:rounded-l-3xl absolute bottom-0 left-16 w-5/12 h-full -translate-x-1/2 -skew-x-10 before:contents before:absolute before:top-0 before:w-1/2 before:right-1/2 before:bottom-0 before:mix-blend-overlay before:bg-opacity-20 before:bg-white' style={backgroundStyle} />
        </div>
      </div>
    </div>
  )
}

export default PlayerAvatar
