import { forwardRef } from 'react'
import ReactSelect from 'react-select'

// eslint-disable-next-line react/display-name
const Select = forwardRef(({ options, isLoading, onInputChange, onChange, value, getOptionValue, noOptionsMessage, isClearable, isSearchable, placeholder = '', filterOption, className = '', defaultValue, ...rest }, ref) => {
  const DropdownIndicator = ({ innerRef, innerProps }) => (
    <svg className='h-5 w-5 text-gray-400' xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true' ref={innerRef} {...innerProps}>
      <path fillRule='evenodd' d='M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z' clipRule='evenodd' />
    </svg>
  )

  const setDefaultValue = rest.isMulti && Array.isArray(value)
    ? options.filter((option) => value.includes((getOptionValue ? getOptionValue(option) : option.value)))
    : options.find((option) => (getOptionValue ? getOptionValue(option) : option.value) === value)

  return (
    <ReactSelect
      options={options}
      isLoading={isLoading}
      onInputChange={onInputChange}
      onChange={onChange}
      defaultValue={defaultValue || setDefaultValue}
      // value={options.find((option) => (getOptionValue ? getOptionValue(option) : option.value) === value)}
      filterOption={filterOption}
      noOptionsMessage={noOptionsMessage}
      isClearable={isClearable}
      isSearchable={isSearchable}
      components={{ DropdownIndicator, IndicatorSeparator: () => null }}
      placeholder={placeholder}
      className={`react_select ${className}`}
      classNamePrefix='react_select'
      ref={ref}
      {...rest}
    />
  )
})

export default Select
