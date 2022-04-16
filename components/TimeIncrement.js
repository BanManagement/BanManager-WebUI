import Button from './Button'

const TimeIncrement = ({ incrementMs = 0, getValues, setValue, field, children }) => {
  return (
    <Button
      className='bg-gray-500 hover:bg-gray-600'
      onClick={(e) => {
        e.preventDefault()

        const value = getValues(field)

        value.setTime(value.getTime() + incrementMs)
        setValue(field, value)
      }}
    >
      {children}
    </Button>
  )
}

export default TimeIncrement
