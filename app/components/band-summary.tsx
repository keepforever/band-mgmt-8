import { Link, useNavigate } from '@remix-run/react'
import React from 'react'
import { bandSubNavigation } from '#app/constants/navigation.js'
import { cn, formatDate, removeLeadingSlash } from '#app/utils/misc.js'
import { type useOptionalUser } from '#app/utils/user.js'

type RootLoaderUserSummary = ReturnType<typeof useOptionalUser>

type BandSummaryProps = {
  user?: RootLoaderUserSummary
}

export const BandSummary: React.FC<BandSummaryProps> = ({ user }) => {
  const navigate = useNavigate()

  return (
    <>
      {user?.bands?.map(bandIterator => {
        const { band, isAdmin } = bandIterator

        return (
          <div className="overflow-hidden bg-accent shadow sm:rounded-lg" key={band.id}>
            <div className="px-4 py-6 sm:px-6">
              <Link to={`${band.id}`} className="block text-foreground hover:text-destructive-foreground">
                <h3 className="text-xl font-semibold leading-7">{band?.name}</h3>
              </Link>
            </div>
            <div className="border-t border-border">
              <dl className="divide-y divide-border">
                {/* Members */}

                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Members</dt>

                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    {band?.members.map((member, index) => (
                      <div
                        key={member.user.id}
                        className="mb-2 mr-2 inline-block rounded-full bg-accent-two px-3 py-1 text-sm font-semibold text-muted"
                      >
                        {`${member.user.name}`}
                        {index < band.members.length - 1 ? <br /> : null}
                      </div>
                    ))}
                  </dd>
                </div>

                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Current Year Revenue</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    {band?.events
                      .reduce((total, event) => total + (event?.event?.payment || 0), 0)
                      .toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                  </dd>
                </div>

                {/* Role */}

                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Your Role in Band</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{isAdmin ? 'Admin' : 'Member'}</dd>
                </div>

                {/* Upcoming Events */}

                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Upcoming Events</dt>

                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    {band?.events.map((event, index) => {
                      if (index === 3)
                        return (
                          <Link
                            to={`${band.id}/events`}
                            key={event.event.id}
                            className="cursor-pointer text-foreground hover:text-destructive"
                          >
                            More...
                          </Link>
                        )

                      if (index > 3) return null

                      return (
                        <div
                          key={event.event.id}
                          className="cursor-pointer text-foreground hover:text-destructive"
                          onClick={() => navigate(`${band.id}/events/${event.event.id}/view`)}
                        >
                          {`Date: ${formatDate(event.event.date)}, Location: ${event.event.venue?.name || 'TBD'}`}
                          {index < band.events.length - 1 ? <br /> : null}
                        </div>
                      )
                    })}
                  </dd>
                </div>

                {/* Quick Links */}

                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Quick Links</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    <ul className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {bandSubNavigation.map(item => {
                        return (
                          <li
                            key={item.name}
                            className="group cursor-pointer rounded-md bg-accent-two/30 p-4 text-foreground hover:bg-destructive/30"
                            onClick={() => navigate(`${band.id}/${removeLeadingSlash(item.to)}`)}
                          >
                            <Link
                              to={`${band.id}/${removeLeadingSlash(item.to)}`}
                              className={cn('flex items-center gap-1 group-hover:text-hyperlink group-hover:underline')}
                            >
                              {item.name}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )
      })}
    </>
  )
}
