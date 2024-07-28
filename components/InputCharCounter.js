export default function InputCharCounter ({ currentLength = 0, minLength = 0, maxLength }) {
  if (currentLength === 0 && minLength > 0) {
    return (
      <p className='text-sm text-gray-300'>Enter at least {minLength} characters</p>
    )
  }
  if (currentLength < minLength) {
    return (
      <p className='text-sm text-gray-300'>{minLength - currentLength} more to go...</p>
    )
  }

  if (currentLength >= minLength) {
    return (
      <p className='text-sm text-gray-300'>{maxLength - currentLength} characters left</p>
    )
  }
}
