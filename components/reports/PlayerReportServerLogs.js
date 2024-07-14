import { format, fromUnixTime } from 'date-fns'
import { BsChevronDown, BsChevronUp } from 'react-icons/bs'
import Table from '../Table'
import AnimatedDisclosure from '../AnimatedDisclosure'
import { useState } from 'react'
import PageHeader from '../PageHeader'

export default function PlayerReportServerLogs ({ report }) {
  const [isOpen, setIsOpen] = useState(false)

  const buttonContent = (
    <div className='flex justify-between w-full text-left' onClick={() => setIsOpen(!isOpen)}>
      <PageHeader title='Server Logs' className='mt-4 w-full text-base !text-left mb-0' />
      {isOpen ? <BsChevronUp /> : <BsChevronDown />}
    </div>
  )

  const panelContent = (
    <Table>
      <Table.Body>
        {report.serverLogs.map(({ id, log }) => (
          <Table.Row key={id} className='text-xs'>
            <Table.Cell className='hidden md:table-cell pl-5 pr-3 whitespace-no-wrap'>
              <div>{format(fromUnixTime(log.created), 'dd MMM yyyy HH:mm:ss')}</div>
            </Table.Cell>
            <Table.Cell className='px-2 py-2 whitespace-no-wrap'>
              <div className='md:hidden'>{format(fromUnixTime(log.created), 'dd MMM yyyy HH:mm:ss')}</div>
              <div>{log.message}</div>
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table>
  )

  return (
    <AnimatedDisclosure containerClassName='w-full p-4' buttonContent={buttonContent} defaultOpen={open}>
      {panelContent}
    </AnimatedDisclosure>
  )
}
