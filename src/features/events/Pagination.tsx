import { Link } from '@/lib/router'

/**
 * Page numbers to show: always the first and last page and the pages next to the current one,
 * with "…" for the gaps, e.g. 1 … 4 5 6 … 12.
 */
export function pageItems(current: number, total: number): (number | '…')[] {
  const pages = [...new Set([1, total, current - 1, current, current + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b)
  const items: (number | '…')[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) items.push('…')
    items.push(p)
  })
  return items
}

interface PaginationProps {
  /** 1-based current page. */
  page: number
  totalPages: number
  size: number
  sizes: readonly number[]
  totalElements: number
  /** Address of a page, so every page is a real link (Ctrl/Cmd-click opens it in a new tab). */
  hrefFor: (page: number, size: number) => string
  onSizeChange: (size: number) => void
}

/** "Showing 11–20 of 34", a page-size picker, and Previous / page numbers / Next. */
function Pagination({ page, totalPages, size, sizes, totalElements, hrefFor, onSizeChange }: PaginationProps) {
  const first = totalElements === 0 ? 0 : (page - 1) * size + 1
  const last = Math.min(page * size, totalElements)

  return (
    <div className="pagination">
      <p className="pagination-summary" aria-live="polite">
        Showing {first}–{last} of {totalElements} {totalElements === 1 ? 'event' : 'events'}
      </p>

      <label className="pagination-size">
        Per page
        <select value={size} onChange={(e) => onSizeChange(Number(e.target.value))}>
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      {totalPages > 1 && (
        <nav className="pagination-pages" aria-label="Pages">
          {page > 1 ? (
            <Link to={hrefFor(page - 1, size)} className="pagination-step" rel="prev">‹ Previous</Link>
          ) : (
            <span className="pagination-step" aria-disabled="true">‹ Previous</span>
          )}
          <ul>
            {pageItems(page, totalPages).map((item, i) =>
              item === '…' ? (
                <li key={`gap-${i}`} className="pagination-gap" aria-hidden="true">…</li>
              ) : (
                <li key={item}>
                  <Link
                    to={hrefFor(item, size)}
                    className={item === page ? 'pagination-page is-current' : 'pagination-page'}
                    aria-current={item === page ? 'page' : undefined}
                    aria-label={`Page ${item}`}
                  >
                    {item}
                  </Link>
                </li>
              ),
            )}
          </ul>
          {page < totalPages ? (
            <Link to={hrefFor(page + 1, size)} className="pagination-step" rel="next">Next ›</Link>
          ) : (
            <span className="pagination-step" aria-disabled="true">Next ›</span>
          )}
        </nav>
      )}
    </div>
  )
}

export default Pagination
