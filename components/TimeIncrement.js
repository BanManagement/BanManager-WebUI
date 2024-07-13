import Button from './Button'

const TimeIncrement = ({ incrementMs = 0, onChange, value, children }) => {
  return (
    <Button
      className='btn-outline'
      disabled={value === 0}
      onClick={(e) => {
        e.preventDefault()

        onChange(value + incrementMs)
      }}
    >
      {children}
    </Button>
  )
}

export default TimeIncrement
