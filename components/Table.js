import { createContext } from 'react'
import clsx from 'clsx'

const TableContext = createContext()

const Table = ({ children }) => {
  return (
    <div className='-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto'>
      <div className='inline-block min-w-full shadow rounded-lg relative'>
        <table className='min-w-full leading-normal border-collapse'>
          {children}
        </table>
      </div>
    </div>
  )
}

const Header = ({ children, className = '' }) => {
  return (
    <thead className={className}>
      <TableContext.Provider value={{ type: 'header' }}>
        {children}
      </TableContext.Provider>
    </thead>
  )
}

const Row = ({ children, className = '' }) => {
  return (
    <TableContext.Consumer>
      {({ type }) => {
        const rowClassName = clsx(`bg-black border-black border-l-2 border-r-2 ${className}`, {
          'hover:bg-gray-900 hover:border-accent-600': type === 'body'
        })

        return (
          <tr className={rowClassName}>{children}</tr>
        )
      }}
    </TableContext.Consumer>
  )
}

const HeaderCell = ({ children, colSpan = 1, border = true }) => {
  return (
    <th scope='col' className={clsx('px-5 py-3 text-left text-sm font-normal', { 'border-b border-accent-200': border })} colSpan={colSpan}>
      {children}
    </th>
  )
}

const Body = ({ children }) => {
  return (
    <tbody>
      <TableContext.Provider value={{ type: 'body' }}>
        {children}
      </TableContext.Provider>
    </tbody>
  )
}

const Footer = ({ children }) => {
  return (
    <tfoot>
      <TableContext.Provider value={{ type: 'footer' }}>
        {children}
      </TableContext.Provider>
    </tfoot>
  )
}

const Cell = ({ children, className = '', colSpan = 1 }) => {
  return (
    <td className={`px-5 py-5 border-b border-accent-200 text-sm ${className}`} colSpan={colSpan}>{children}</td>
  )
}

Table.Header = Header
Table.Row = Row
Table.HeaderCell = HeaderCell
Table.Body = Body
Table.Footer = Footer
Table.Cell = Cell

export default Table
