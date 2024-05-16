import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json } from '@remix-run/react'
import { BandSummary } from '#app/components/band-summary.js'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { Button } from '#app/components/ui/button'
import { requireUserId, requireUserBelongToBand } from '#app/utils/auth.server'
import { cn } from '#app/utils/misc.js'
import { useOptionalUser } from '#app/utils/user'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  await requireUserBelongToBand(request, params)

  return json({ userId })
}

export default function BandsIndex() {
  const user = useOptionalUser()
  const userHasBand = (user?.bands?.length || 0) > 0

  if (!userHasBand)
    return (
      <EmptyStateGeneric
        title="You don't have any bands yet."
        messages={['Create a band to get started']}
        iconNames={['rocket']}
        linkTo="new"
        buttonTitle="Create Band"
      />
    )

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex justify-between">
        <h1 className="text-3xl font-bold">Your Bands</h1>
        <Button
          asChild
          variant="default"
          size="lg"
          className={cn({
            hidden: userHasBand,
          })}
        >
          <Link to="new">Create</Link>
        </Button>
      </div>

      <BandSummary user={user} />
    </div>
  )
}
