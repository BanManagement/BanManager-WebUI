import { createMachine, assign } from 'xstate'
import { AiOutlineQuestion, AiOutlineUser } from 'react-icons/ai'
import { FaBan } from 'react-icons/fa'
import { MdOutlineGavel } from 'react-icons/md'
import { AskQuestion } from '../AskQuestion'
import TutorialLogin from '../TutorialLogin'
import PunishmentPicker from '../PunishmentPicker'

const setContext = (field) => assign((context, event) => ({ ...context, [field]: event.type }))

export const stages = [
  {
    id: 'loginType',
    label: 'Channel',
    icon: <AiOutlineQuestion className='w-5 h-5 mr-3' />,
    component: AskQuestion('How would you like to login?')
  },
  {
    id: 'login',
    label: 'Login',
    icon: <AiOutlineUser className='w-5 h-5 mr-3' />,
    component: TutorialLogin
  },
  {
    id: 'choosePunishment',
    label: 'Punishment',
    icon: <FaBan className='w-5 h-5 mr-3' />,
    component: PunishmentPicker
  },
  {
    id: 'appeal',
    label: 'Appeal',
    icon: <MdOutlineGavel className='w-5 h-5 mr-3' />,
    component: <></>
  }
]

export const machine = createMachine({
  id: 'tutorial',
  initial: 'loginType',
  context: {
    loginType: null,
    punishment: null
  },
  states: {
    loginType: {
      on: {
        'Not sure, help!': {
          target: 'login',
          actions: setContext('loginType')
        },
        'I have a 6 digit pin': {
          target: 'login',
          actions: setContext('loginType')
        },
        'I already have an account': {
          target: 'login',
          actions: setContext('loginType')
        }
      }
    },
    login: {
      on: {
        Next: {
          target: 'choosePunishment'
        },
        Back: {
          target: 'loginType'
        }
      }
    },
    choosePunishment: {
      on: {
        Next: {
          target: 'appeal'
        }
      }
    },
    appeal: {
      type: 'final'
    }
  }
})
