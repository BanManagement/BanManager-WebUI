import { useMachine } from '@xstate/react'
import { machine, stages } from './machine'
import { Steps } from './Steps'
import { Step } from './Step'

export const Wizard = () => {
  const [current, send] = useMachine(machine)

  const currentStageId = current.value
  const activeStep = stages.findIndex(s => {
    return s.id === currentStageId || s.parent === currentStageId
  })

  return (
    <div className='container px-5 mx-auto flex flex-wrap flex-col'>
      <div className='flex mx-auto flex-wrap justify-center'>
        <Steps activeStep={activeStep}>
          {stages.map(stage => {
            return (
              <Step key={stage.id} {...stage} />
            )
          })}
        </Steps>
      </div>
      <div className='flex mx-auto flex-wrap flex-col mt-6'>
        {stages.map(stage => (
          <Stage
            key={stage.id}
            handleNext={(type, response) => send({ type, response })}
            isActive={current.matches(stage.id)}
            currentState={current}
            component={stage.component}
          />
        ))}
      </div>
    </div>
  )
}

function Stage ({ isActive, component, handleNext, currentState, options }) {
  return isActive && component({ handleNext, currentState, options })
}
