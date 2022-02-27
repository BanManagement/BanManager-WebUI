import { Children, cloneElement } from 'react'

export const Steps = ({ children, activeStep }) => {
  let count = 0

  Children.forEach(children, child => child.props.label ? count++ : null)

  const steps = Children.map(children, (child, index) => {
    const stepNumber = index + 1
    const childProps = {
      stepNumber,
      isActiveStep: activeStep === index,
      ...child.props
    }

    if (!child.props.label) return null

    return (
      <>
        {cloneElement(child, childProps)}
      </>
    )
  })
  return (
    <>
      {steps}
    </>
  )
}
