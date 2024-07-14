import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react'
import { useRef } from 'react'

export default function AnimatedDisclosure ({ containerClassName = '', children, buttonContent, defaultOpen = false }) {
  const panelRef = useRef(null)

  return (
    <Disclosure as='div' className={containerClassName} defaultOpen={defaultOpen}>
      {({ open }) => (
        <>
          <DisclosureButton className='w-full'>
            {buttonContent}
          </DisclosureButton>
          <div className='overflow-hidden' ref={panelRef} style={{ height: open ? `${panelRef?.current?.scrollHeight}px` : '0px', transition: 'height 0.2s ease-out' }}>
            <DisclosurePanel className='origin-top'>
              {children}
            </DisclosurePanel>
          </div>
        </>
      )}
    </Disclosure>
  )
}
