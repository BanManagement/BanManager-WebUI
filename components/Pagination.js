import { useMemo } from 'react'
import clsx from 'clsx'

// https://gist.github.com/kottenator/9d936eb3e4e3c3e02598#gistcomment-3238804
const getRange = (start, end) => {
  return Array(end - start + 1)
    .fill()
    .map((v, i) => i + start)
}

const pagination = (currentPage, pageCount) => {
  let delta
  if (pageCount <= 7) {
    // delta === 7: [1 2 3 4 5 6 7]
    delta = 7
  } else {
    // delta === 2: [1 ... 4 5 6 ... 10]
    // delta === 4: [1 2 3 4 5 ... 10]
    delta = currentPage > 4 && currentPage < pageCount - 3 ? 2 : 4
  }

  const range = {
    start: Math.round(currentPage - delta / 2),
    end: Math.round(currentPage + delta / 2)
  }

  if (range.start - 1 === 1 || range.end + 1 === pageCount) {
    range.start += 1
    range.end += 1
  }

  let pages =
    currentPage > delta
      ? getRange(Math.min(range.start, pageCount - delta), Math.min(range.end, pageCount))
      : getRange(1, Math.min(pageCount, delta + 1))

  const withDots = (value, pair) => (pages.length + 1 !== pageCount ? pair : [value])

  if (pages[0] !== 1) {
    pages = withDots(1, [1, '...']).concat(pages)
  }

  if (pages[pages.length - 1] < pageCount) {
    pages = pages.concat(withDots(pageCount, ['...', pageCount]))
  }

  return pages
}

// Based on https://github.com/AdeleD/react-paginate/issues/339
export const PAGE_LINK_TYPES = {
  page: 'page',
  prev: 'prev',
  ellipsis: 'ellipsis',
  next: 'next'
}

const excludeNullLinks = (link) => link !== null

export const usePagination = ({ pageCount, currentPageNumber, onPageChange, pageShownCount }) => {
  const buildLink = (type, pageNumber, isCurrent) => ({
    type,
    linkContent: pageNumber.toString(),
    onPageChange: () => pageNumber > 0 && pageNumber <= pageCount && onPageChange({ activePage: pageNumber }),
    isCurrent,
    ariaLabel: `Page ${pageNumber}`,
    ariaCurrent: isCurrent ? 'page' : null
  })
  return useMemo(
    () => {
      const links = pagination(currentPageNumber, pageCount).map((pageNumber, index) => {
        const isCurrent = pageNumber === currentPageNumber

        return buildLink(PAGE_LINK_TYPES.page, pageNumber, isCurrent, onPageChange)
      })

      return [
        buildLink(PAGE_LINK_TYPES.prev, currentPageNumber - 1),
        ...links,
        buildLink(PAGE_LINK_TYPES.next, currentPageNumber + 1)
      ].filter(excludeNullLinks)
    },
    [pageCount, currentPageNumber]
  )
}

const ItemPrev = ({ onPageChange }) => (
  <button onClick={onPageChange} type='button' className='w-full p-4 text-base rounded-l-xl text-gray-600 bg-black hover:bg-gray-900'>
    <svg width='9' fill='currentColor' height='8' className='' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'>
      <path d='M1427 301l-531 531 531 531q19 19 19 45t-19 45l-166 166q-19 19-45 19t-45-19l-742-742q-19-19-19-45t19-45l742-742q19-19 45-19t45 19l166 166q19 19 19 45t-19 45z' />
    </svg>
  </button>
)

const ItemNext = ({ onPageChange }) => (
  <button onClick={onPageChange} type='button' className='w-full p-4 text-base rounded-r-xl text-gray-600 bg-black hover:bg-gray-900'>
    <svg width='9' fill='currentColor' height='8' className='' viewBox='0 0 1792 1792' xmlns='http://www.w3.org/2000/svg'>
      <path d='M1363 877l-742 742q-19 19-45 19t-45-19l-166-166q-19-19-19-45t19-45l531-531-531-531q-19-19-19-45t19-45l166-166q19-19 45-19t45 19l742 742q19 19 19 45t-19 45z' />
    </svg>
  </button>
)

const Item = ({ active, onPageChange, children }) => {
  const className = clsx('w-full px-4 py-2 text-base bg-black hover:bg-gray-900', {
    'text-accent-500': active
  })
  return (
    <button
      type='button'
      className={className}
      onClick={onPageChange}
    >
      {children}
    </button>
  )
}

const Pagination = ({ totalPages, activePage, onPageChange }) => {
  const { prev, ellipsis, next } = PAGE_LINK_TYPES
  const links = usePagination({
    onPageChange,
    currentPageNumber: activePage,
    pageCount: totalPages < 1 ? 1 : totalPages,
    pageShownCount: 5
  })

  if (totalPages <= 1) return null

  return (
    <div className='px-5 py-5 flex flex-col xs:flex-row items-center xs:justify-between'>
      <div className='flex items-center'>
        {links.map(({ linkContent, type, isCurrent, onPageChange }, index) => {
          if (type === prev) return <ItemPrev key={index} onPageChange={onPageChange} />
          if (type === next) return <ItemNext key={index} onPageChange={onPageChange} />
          if (type === ellipsis) return <Item key={index}>{linkContent}</Item>

          return <Item key={index} active={isCurrent} onPageChange={onPageChange}>{linkContent}</Item>
        })}
      </div>
    </div>
  )
}

export default Pagination
