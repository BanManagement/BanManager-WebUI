const RadialProgressBar = ({ size, radius, progress, title }) => {
  const width = `w-${size}`
  const height = `h-${size}`
  const circumference = Number((2 * Math.PI * radius).toFixed(1))
  const strokeDashOffset = (circumference - (circumference * progress) / 100)

  return (
    <div className={`relative ${width} ${height}`}>
      <svg className='w-full h-full' viewBox='0 0 100 100'>
        <circle
          className='text-primary-900 stroke-current'
          strokeWidth='10'
          cx='50'
          cy='50'
          r={radius}
          fill='transparent'
        />

        <circle
          className='text-accent-700 progress-ring__circle stroke-current'
          strokeWidth='10'
          strokeLinecap='round'
          cx='50'
          cy='50'
          r={radius}
          fill='transparent'
          strokeDasharray={circumference}
          strokeDashoffset={`${strokeDashOffset}px`}
        />

        <text
          x='50'
          y='55'
          fontSize='12'
          textAnchor='middle'
          className='fill-current'
          alignmentBaseline='middle'
        >{title}
        </text>
      </svg>
    </div>
  )
}

export default RadialProgressBar
