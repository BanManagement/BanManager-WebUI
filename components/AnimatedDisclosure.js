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
          <div className='overflow-hidden' ref={panelRef}>
            <DisclosurePanel transition className='origin-top transition duration-200 ease-out data-[closed]:-translate-y-6 data-[closed]:opacity-0'>
              {children}
            </DisclosurePanel>
          </div>
        </>
      )}
    </Disclosure>
  )
}
