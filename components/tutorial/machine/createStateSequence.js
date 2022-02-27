export function createStateSequence (stages) {
  const states = stages.reduce((acc, stage, i) => {
    const nextStage = stages[i + 1]
    acc[stage.id] = {
      on: {
        NEXT: {
          target: nextStage ? nextStage.id : 'done',
          cond: stage.cond,
          actions: stage.actions
        }
      }
    }
    return acc
  }, {})

  states.done = {
    on: {
      RESET: {
        target: stages[0].id,
        actions: ['reset']
      }
    }
  }
  return states
}
