import { Link, useFetcher, useNavigate } from '@remix-run/react'
import React, { useEffect } from 'react'
import { bandSubNavigation } from '#app/constants/navigation.js'
import { type loader as bandRevenueLoader } from '#app/routes/resources+/band-revenue.tsx'
import { cn, formatDate, removeLeadingSlash } from '#app/utils/misc.js'
import { type useOptionalUser } from '#app/utils/user.js'

type RootLoaderUserSummary = ReturnType<typeof useOptionalUser>

type BandSummaryProps = {
  user?: RootLoaderUserSummary
}

export const useBandRevenue = (bandId?: string) => {
  const revenueFetcher = useFetcher<typeof bandRevenueLoader>({ key: 'revenue-fetcher' })
  const [isMounted, setIsMounted] = React.useState(false)

  useEffect(() => {
    const loadRevenue = async () => {
      if (!bandId) {
        setIsMounted(true)
        return
      }
      const encodedBandId = encodeURIComponent(bandId)
      revenueFetcher.load(`/resources/band-revenue?bandId=${encodedBandId}`)
      setIsMounted(true)
    }

    if (isMounted) return
    loadRevenue()
  }, [revenueFetcher, isMounted, bandId])

  const bandRevenue = revenueFetcher.data?.currentYearRevenue

  return bandRevenue
}

export const BandSummary: React.FC<BandSummaryProps> = ({ user }) => {
  const navigate = useNavigate()
  const bandRevenue = useBandRevenue(user?.bands?.[0].band.id)

  return (
    <>
      {user?.bands?.map(bandIterator => {
        const { band } = bandIterator

        return (
          <div className="overflow-hidden border border-border sm:rounded-md" key={band.id}>
            <div className="px-2 py-3 sm:px-6">
              <Link to={`${band.id}`} className="block text-foreground hover:text-destructive-foreground">
                <h3 className="text-xl font-semibold leading-7">{band?.name}</h3>
              </Link>
            </div>
            <div className="border-t border-border">
              <dl className="divide-y divide-border">
                {/* Members */}

                <div className="px-2 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Members</dt>

                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    {band?.members.map((member, index) => (
                      <div
                        key={member.user.id}
                        className="mb-2 mr-2 inline-block rounded-full bg-background px-3 py-1 text-sm font-semibold text-foreground"
                      >
                        {`${member.user.name}`}
                        {index < band.members.length - 1 ? <br /> : null}
                      </div>
                    ))}
                  </dd>
                </div>

                <div className="px-2 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Current Year Revenue</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    {bandRevenue?.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </dd>
                </div>

                {/* Role */}

                {/* <div className="px-2 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Your Role in Band</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">{isAdmin ? 'Admin' : 'Member'}</dd>
                </div> */}

                {/* Upcoming Events */}

                <div className="px-2 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
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

                <div className="px-2 py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  {/* /bands */}

                  <dt className="text-sm font-medium">Quick Links</dt>

                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    <ul className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {bandSubNavigation.map(item => {
                        return (
                          <li
                            key={item.name}
                            className="group cursor-pointer rounded-md border border-border p-2"
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
