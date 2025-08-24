import { type Setlist as SetlistModel } from '@prisma/client'
import { type SerializeFrom, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useSearchParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { Checkbox } from '#app/components/ui/checkbox'
import { Icon } from '#app/components/ui/icon.js'
import { Label } from '#app/components/ui/label'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'

export type Setlist = SerializeFrom<Pick<SetlistModel, 'name' | 'createdAt' | 'id' | 'updatedAt'>> & {
  events: {
    name: string
    date: string
  }[]
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)

  const url = new URL(request.url)
  const sortBy = url.searchParams.get('sortBy')
  const sortDirection = url.searchParams.get('sortDirection') as 'asc' | 'desc' | null
  const futureEventsOnly = url.searchParams.get('futureEventsOnly') === 'true'

  const bandId = params.bandId

  // Build the orderBy clause based on sorting parameters
  let orderBy: any = { updatedAt: 'desc' } // default sort

  if (sortBy && sortDirection) {
    switch (sortBy) {
      case 'name':
        orderBy = { name: sortDirection }
        break
      case 'updatedAt':
        orderBy = { updatedAt: sortDirection }
        break
      case 'createdAt':
        orderBy = { createdAt: sortDirection }
        break
      // For events count, we'll need to handle it differently since it's a computed field
      // For now, we'll fall back to default sorting
      default:
        orderBy = { updatedAt: 'desc' }
    }
  }

  // Build the where clause
  let whereClause: any = {
    BandSetlist: {
      some: {
        bandId,
      },
    },
  }

  // If filtering for future events only, add the condition
  if (futureEventsOnly) {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today

    whereClause = {
      ...whereClause,
      events: {
        some: {
          date: {
            gte: today,
          },
        },
      },
    }
  }

  const setlists = await prisma.setlist.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      events: {
        select: {
          name: true,
          date: true,
        },
      },
    },
    orderBy,
  })
  return json({ setlists })
}

export default function SetlistsRoute() {
  const { setlists } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const futureEventsOnly = searchParams.get('futureEventsOnly') === 'true'

  const handleFutureEventsFilter = (checked: boolean) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev)
      if (checked) {
        newParams.set('futureEventsOnly', 'true')
      } else {
        newParams.delete('futureEventsOnly')
      }
      return newParams
    })
  }

  const columns: Column<Setlist>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      sortable: true,
      render: (_, setlist) => (
        <div className="flex items-center gap-3">
          {setlist.name}

          <Link title="Clone Setlist" to={`new?clonedSetlistId=${setlist.id}`} onClick={e => e.stopPropagation()}>
            <Icon name="copy" size="sm" className="hover:text-hyperlink" />
          </Link>
        </div>
      ),
    },
    {
      title: 'Event',
      dataIndex: 'events',
      sortable: false, // Events count is computed, can't easily sort on server
      render: (events: Setlist['events']) => {
        if (!events.length) {
          return <span className="flex items-center text-xs">No Events</span>
        }

        const now = new Date()
        const futureEvents = events.filter(event => new Date(event.date) >= now)
        const pastEvents = events.filter(event => new Date(event.date) < now)

        return (
          <div className="flex items-center gap-2 text-xs">
            <span>{`${events.length} Events`}</span>
            {futureEvents.length > 0 && (
              <span className="rounded bg-green-100 px-2 py-1 text-green-800">{futureEvents.length} future</span>
            )}
            {pastEvents.length > 0 && (
              <span className="rounded bg-gray-100 px-2 py-1 text-gray-600">{pastEvents.length} past</span>
            )}
          </div>
        )
      },
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      sortable: true,
      render: updatedAt => new Date(updatedAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="max-w-3xl">
      <HeaderWithActions title="Setlists">
        <Button asChild variant="secondary" size="lg">
          <Link to="new">Create</Link>
        </Button>
      </HeaderWithActions>

      {/* Filter Controls - Always visible */}
      <div className="mb-4 flex items-center gap-2">
        <Checkbox id="futureEventsOnly" checked={futureEventsOnly} onCheckedChange={handleFutureEventsFilter} />
        <Label
          htmlFor="futureEventsOnly"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Show only setlists with future events
        </Label>
      </div>

      {setlists.length === 0 ? (
        <EmptyStateGeneric
          title="No Setlists"
          messages={[
            futureEventsOnly
              ? 'No setlists with future events found. Try unchecking the filter or create a new setlist.'
              : 'Create a new setlist by clicking the "Create" button above.',
          ]}
          iconNames={['rocket']}
          linkTo="new"
          buttonTitle="Create Setlist"
        />
      ) : (
        <TableGeneric columns={columns} data={setlists} onRowClick={setlist => navigate(`${setlist.id}/view`)} />
      )}
    </div>
  )
}
