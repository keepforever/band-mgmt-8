import { type Tech } from '@prisma/client'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { EmptyStateGeneric } from '#app/components/empty-state-generic.js'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { requireUserBelongToBand, requireUserId } from '#app/utils/auth.server.js'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  await requireUserId(request)
  await requireUserBelongToBand(request, params)
  const bandId = params.bandId
  const techs = await prisma.bandTech.findMany({
    where: {
      bandId,
    },
    select: {
      tech: {
        select: {
          id: true,
          name: true,
          contactInfo: true,
          events: {
            select: {
              event: {
                select: {
                  name: true,
                  venue: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          serviceType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })
  return json({
    techs: techs.map(t => ({
      id: t.tech.id,
      name: t.tech.name,
      serviceType: t.tech.serviceType.name,
      contactInfo: t.tech.contactInfo,
      // map event to single string of event name and venue name
      events: t.tech.events.map(e => `${e.event.name} (${e.event.venue?.name})`),
    })),
  })
}

type TechInfo = Pick<Tech, 'id' | 'name' | 'contactInfo'> & { serviceType: string; events: string[] }

export default function TechsIndexRoute() {
  const { techs } = useLoaderData<typeof loader>()
  const { bandId } = useParams()
  const navigate = useNavigate()

  const columns: Column<TechInfo>[] = [
    {
      title: 'Name',
      dataIndex: 'name',
      render: (value, record) => <Link to={`/bands/${bandId}/techs/${record.id}/view`}>{value}</Link>,
    },
    {
      title: 'Service Type',
      dataIndex: 'serviceType',
    },
    {
      title: 'Contact Info',
      dataIndex: 'contactInfo',
      render(value) {
        return (
          <div className="flex max-h-[200px] max-w-[300px] break-before-all flex-wrap whitespace-normal break-words">
            <details onClick={e => e.stopPropagation()}>
              <summary>{value.slice(0, 20)}...</summary>
              {value}
            </details>
          </div>
        )
      },
    },
    {
      title: 'Events',
      dataIndex: 'name',
      render(v, record) {
        const preview = record?.events?.join?.(', ')

        return preview ? (
          <details onClick={e => e.stopPropagation()}>
            <summary title={preview.slice(0, 20)}>Events</summary>
            <div className="flex flex-col gap-2 pt-2">
              {record.events.map((event, i) => (
                <div key={i}>{event}</div>
              ))}
            </div>
          </details>
        ) : (
          <div>N/A</div>
        )
      },
    },
  ]

  return (
    <div className="max-w-3xl">
      {techs.length === 0 ? (
        <EmptyStateGeneric
          title="No Techs"
          messages={['Click the button below to create a new tech.']}
          iconNames={['rocket']}
          linkTo="new"
          buttonTitle="Create Tech"
        />
      ) : (
        <>
          <HeaderWithActions title="Techs">
            <Link to="new">
              <Button variant="secondary" size="sm">
                Add New Tech
              </Button>
            </Link>
          </HeaderWithActions>

          <TableGeneric
            columns={columns}
            data={techs}
            onRowClick={event => navigate(`/bands/${bandId}/techs/${event.id}/view`)}
          />
        </>
      )}
    </div>
  )
}
