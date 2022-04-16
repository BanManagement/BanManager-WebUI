import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useRef } from 'react'
import clsx from 'clsx'

export default function Modal ({ open = false, icon, title, children, confirmButton, onCancel, onConfirm, loading }) {
  const cancelButtonRef = useRef(null)
  const onClose = () => {
    onCancel()
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as='div' className='fixed z-10 inset-0 overflow-y-auto' initialFocus={cancelButtonRef} onClose={onClose}>
        <div className='flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0'
            enterTo='opacity-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100'
            leaveTo='opacity-0'
          >
            <Dialog.Overlay className='fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity' />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className='hidden sm:inline-block sm:align-middle sm:h-screen' aria-hidden='true'>
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter='ease-out duration-300'
            enterFrom='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
            enterTo='opacity-100 translate-y-0 sm:scale-100'
            leave='ease-in duration-200'
            leaveFrom='opacity-100 translate-y-0 sm:scale-100'
            leaveTo='opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
          >
            <div className='isolate inline-block align-bottom bg-black rounded-lg text-left shadow-xl transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='bg-black px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='sm:flex sm:items-start'>
                  {icon &&
                    <div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                      {icon}
                    </div>}
                  <div className={clsx('mt-3 text-center sm:mt-0 sm:text-left w-full', { 'sm:ml-4': !!icon })}>
                    <Dialog.Title as='h3' className='text-lg leading-6 font-medium text-white'>
                      {title}
                    </Dialog.Title>
                    <div className='mt-2 text-white text-sm'>
                      {children}
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm'
                  onClick={onConfirm}
                >
                  {loading && <div className='loader -ml-1 mr-3 h-5 w-5' />}
                  {confirmButton}
                </button>
                <button
                  type='button'
                  className='mt-3 w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                  onClick={onCancel}
                  ref={cancelButtonRef}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
