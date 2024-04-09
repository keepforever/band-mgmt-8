import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useNavigate } from '@remix-run/react'
import { BandSummary } from '#app/components/band-summary.js'
import { Button } from '#app/components/ui/button'
import { requireUserId } from '#app/utils/auth.server'
import { useOptionalUser } from '#app/utils/user'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  return json({ userId })
}

export default function BandsIndex() {
  const user = useOptionalUser()

  console.log('\n', `user = `, user, '\n')

  return (
    <div>
      <div className="flex justify-between">
        <h1 className="text-3xl font-bold">Your Bands</h1>
        <Button asChild variant="default" size="lg">
          <Link to="new">Create</Link>
        </Button>
      </div>

      {user?.bands?.map(band => {
        const memberCount = band.band.members.length
        const bandName = band.band.name

        return (
          <BandSummary
            id={band?.band?.id}
            key={band?.band?.id}
            name={bandName}
            memberCount={memberCount}
            upcomingEventsCount={band?.band?.events.length}
          />
        )
      })}
    </div>
  )
}
