import { useState, useEffect, useCallback } from 'react'
import clsx from 'clsx'
import Button from './Button'
import { FaInfinity } from 'react-icons/fa'
import { MdOutlineCalendarMonth } from 'react-icons/md'
import DateTimePicker from './DateTimePicker'
import TimeIncrement from './TimeIncrement'

const ExpiresInput = ({ onChange, value }) => {
  const [isInputVisible, setInputVisible] = useState(value !== 0)
  const [buttonContent, setButtonContent] = useState(value ? <FaInfinity /> : 'Permanent')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [inputTransitionState, setInputTransitionState] = useState(value === 0 ? 'hidden' : 'visible')
  const disablePast = useCallback(current => current > new Date(), [])

  const toggleInput = (e) => {
    e.preventDefault()
    setIsTransitioning(true)
    setInputVisible(!isInputVisible)
    setInputTransitionState(isInputVisible ? 'hidden' : 'showing')
    onChange(isInputVisible ? 0 : value || Date.now())
  }

  useEffect(() => {
    if (inputTransitionState === 'showing') {
      const timeoutId = setTimeout(() => {
        setInputTransitionState('visible')
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [inputTransitionState])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setButtonContent(isInputVisible ? <FaInfinity /> : 'Permanent')
      setIsTransitioning(false)
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [isInputVisible])

  return (
    <div>
      <div className='relative flex items-center justify-end'>
        <div className={clsx(
          'transition-opacity duration-500 ease-in-out transform w-full',
          {
            'scale-0 opacity-0 absolute': inputTransitionState === 'hidden',
            'scale-100 opacity-100': inputTransitionState === 'visible'
          }
        )}
        >
          <DateTimePicker dateTypeMode='utc-ms-timestamp' inputClassName='!rounded-none' icon={<MdOutlineCalendarMonth />} isValidDate={disablePast} onChange={onChange} value={value} />
        </div>
        <Button
          className={clsx(
            'transition-all duration-500 ease-in-out h-12 bg-red-700 mb-6 items-center',
            { 'w-1/12 rounded-l-none !bg-red-800': isInputVisible, 'w-full': !isInputVisible }
          )}
          onClick={toggleInput}
        >
          <span className={clsx(
            'transition-opacity duration-500 ease-in-out',
            { 'opacity-0': isTransitioning, 'opacity-100': !isTransitioning }
          )}
          >
            {buttonContent}
          </span>
        </Button>
      </div>
      <div className='flex relative mb-6 gap-12'>
        <TimeIncrement
          incrementMs={1 * 60 * 60 * 1000}
          value={value}
          onChange={onChange}
        >
          +1 hour
        </TimeIncrement>
        <TimeIncrement
          incrementMs={24 * 60 * 60 * 1000}
          value={value}
          onChange={onChange}
        >
          +1 day
        </TimeIncrement>
      </div>
    </div>
  )
}

export default ExpiresInput
