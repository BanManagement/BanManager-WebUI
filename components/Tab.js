import { Tab as HeadlessTab } from '@headlessui/react'
import clsx from 'clsx'
import { Fragment } from 'react'

export default function Tab ({ children, className = '' }) {
  return (
    <HeadlessTab
      as={Fragment}
    >
      {({ selected }) => (
        <button className={clsx(`px-4 py-2 hover:opacity-80 ${className} border-b border-accent-700 relative top-[1px] z-0`, { 'rounded-t-md border-x border-t border-b-1 border-b-primary-800 z-10': selected })}>
          {children}
        </button>
      )}
    </HeadlessTab>
  )
}
