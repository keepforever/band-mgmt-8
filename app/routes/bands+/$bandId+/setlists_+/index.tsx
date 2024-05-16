import { type Setlist as SetlistModel } from '@prisma/client'
import { type SerializeFrom, type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { Icon } from '#app/components/ui/icon.js'
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

  const bandId = params.bandId
  const setlists = await prisma.setlist.findMany({
    where: {
      BandSetlist: {
        some: {
          bandId,
        },
      },
    },
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
  })
  return json({ setlists })
}

export default function SetlistsRoute() {
  const { setlists } = useLoaderData<typeof loader>()
  const navigate = useNavigate()

  const columns: Column<Setlist>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
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
      render: (events: Setlist['events']) =>
        !events.length ? (
          <span className="flex items-center text-xs">No Events</span>
        ) : (
          <div className="flex items-center text-xs">{`${events.length} Events`}</div>
        ),
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      render: updatedAt => new Date(updatedAt).toLocaleDateString(),
    },
  ]

  return (
    <div className="max-w-3xl">
      {setlists.length === 0 ? (
        <EmptyStateGeneric
          title="No Setlists"
          messages={['Create a new setlist by clicking the "Create" button above.']}
          iconNames={['rocket']}
          linkTo="new"
          buttonTitle="Create Setlist"
        />
      ) : (
        <>
          <HeaderWithActions title="Setlists">
            <Button asChild variant="secondary" size="lg">
              <Link to="new">Create</Link>
            </Button>
          </HeaderWithActions>
          <TableGeneric columns={columns} data={setlists} onRowClick={setlist => navigate(`${setlist.id}/view`)} />
        </>
      )}
    </div>
  )
}
