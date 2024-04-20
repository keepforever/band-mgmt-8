import React from 'react'
import { Link, useLocation } from 'react-router-dom'

type BreadcrumbProps = {
  // Add any specific types if needed
}

export const Breadcrumbs: React.FC<BreadcrumbProps> = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter(x => x)

  return (
    <div className="hidden py-2 pl-8 text-xs sm:block">
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
    </div>
  )
}
