import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserDropdown } from './user-dropdown'

type BreadcrumbProps = {
  // Add any specific types if needed
}

export const Breadcrumbs: React.FC<BreadcrumbProps> = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  return (
    <div className="mb-4 hidden items-center justify-between py-1 pl-8 text-xs sm:mr-6 sm:flex">
      <ul className="flex">
        <li>
          <Link to="/" className="text-muted-foreground">
            Home
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1
          const to = `/${pathnames.slice(0, index + 1).join('/')}`

          return (
            <React.Fragment key={to}>
              <li className="mx-2">/</li>
              <li>
                {last ? (
                  <span className="text-foreground">{value}</span>
                ) : (
                  <Link to={to} className="text-muted-foreground hover:text-accent-two">
                    {value}
                  </Link>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ul>

      {/* Usar Avatar */}

      <UserDropdown />
    </div>
  )
}
