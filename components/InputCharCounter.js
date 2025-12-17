export default function InputCharCounter ({ currentLength = 0, minLength = 0, maxLength }) {
  if (currentLength === 0 && minLength > 0) {
    return (
      <p className='text-sm text-gray-300 whitespace-nowrap'>Min {minLength} chars</p>
    )
  }
  if (currentLength < minLength) {
    return (
      <p className='text-sm text-gray-300 whitespace-nowrap'>{minLength - currentLength} more to go</p>
    )
  }

  if (currentLength >= minLength) {
    return (
      <p className='text-sm text-gray-300 whitespace-nowrap'>{maxLength - currentLength} left</p>
    )
  }
}
