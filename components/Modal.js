import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { useRef } from 'react'
import Button from './Button'

export default function Modal ({ open = false, containerClassName = '', title, children, cancelButton = 'Cancel', confirmButton, confirmDisabled, onCancel, onConfirm, loading }) {
  const cancelButtonRef = useRef(null)
  const onClose = () => {
    onCancel()
  }

  return (
    <Dialog open={open} transition className='relative inset-0 overflow-y-auto z-50' initialFocus={cancelButtonRef} onClose={onClose}>
      <DialogBackdrop
        transition
        className='fixed inset-0 bg-black/50 duration-300 ease-out data-[closed]:opacity-0'
      />
      <div className='fixed inset-0 w-screen items-center justify-center overflow-y-auto p-4 text-gray-200'>
        <div className={`flex min-h-full mx-auto items-center justify-center w-full max-w-md ${containerClassName}`}>
          <DialogPanel
            transition
            className='w-full bg-primary-500 rounded-3xl space-y-4 p-4 duration-300 ease-out data-[closed]:scale-95 data-[closed]:opacity-0 shadow-lg shadow-black'
          >
            <DialogTitle as='h3' className='text-3xl text-center font-bold pb-4 mb-4 border-b border-accent-400 leading-none'>
              {title}
            </DialogTitle>
            <div className='mt-2 text-sm'>
              {children}
            </div>
            <div className='px-4 py-3 sm:px-6 gap-10 flex flex-row-reverse'>
              {confirmButton &&
                <Button
                  className='w-full'
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  loading={loading}
                >
                  {confirmButton}
                </Button>}
              <Button
                className='w-full bg-primary-900'
                onClick={onCancel}
                ref={cancelButtonRef}
              >
                {cancelButton}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
