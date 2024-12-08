import { TabPanels as HeadlessTabPanels } from '@headlessui/react'
import { Fragment } from 'react'

export default function TabPanels ({ children }) {
  return (
    <HeadlessTabPanels
      as={Fragment}
    >
      {() => (
        <div className='border-accent-700 border-t pt-2'>
          {children}
        </div>
      )}
    </HeadlessTabPanels>
  )
}
