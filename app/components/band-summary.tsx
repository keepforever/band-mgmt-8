import { useNavigate } from '@remix-run/react'
import React from 'react'
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
        // Assuming the first band in the array is the one to display

        return (
          <div className="overflow-hidden bg-accent shadow sm:rounded-lg" key={band.id}>
            <div className="px-4 py-6 sm:px-6">
              <h3 className="text-base font-semibold leading-7">{band?.name}</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
                Details and upcoming events for your band.
              </p>
            </div>
            <div className="border-t border-border">
              <dl className="divide-y divide-border">
                {/* Members */}

                <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium">Members</dt>
                  <dd className="mt-1 text-sm leading-6 sm:col-span-2 sm:mt-0">
                    {band?.members.map((member, index) => (
                      <div key={member.user.id}>
                        {`Name: ${member.user.name}`}
                        {index < band.members.length - 1 ? <br /> : null}
                      </div>
                    ))}
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
                    {band?.events.map((event, index) => (
                      <div
                        key={event.event.id}
                        className="cursor-pointer text-foreground hover:text-destructive-foreground"
                        onClick={() => navigate(`/events/${event.event.id}`)}
                      >
                        {`Date: ${new Date(event.event.date).toLocaleDateString()}, Location: ${
                          event.event.venue?.name || 'TBD'
                        }`}
                        {index < band.events.length - 1 ? <br /> : null}
                      </div>
                    ))}
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
