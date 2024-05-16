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
    include: {
      tech: {
        include: {
          serviceType: true,
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
    })),
  })
}

type TechInfo = Pick<Tech, 'id' | 'name' | 'contactInfo'> & { serviceType: string }

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
