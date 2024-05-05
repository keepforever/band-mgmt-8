import { type Tech } from '@prisma/client'
import { type LoaderFunctionArgs } from '@remix-run/node'
import { Link, json, useLoaderData, useNavigate, useParams } from '@remix-run/react'
import { HeaderWithActions } from '#app/components/header-with-actions.js'
import { TableGeneric, type Column } from '#app/components/table-generic'
import { Button } from '#app/components/ui/button'
import { prisma } from '#app/utils/db.server'

export const loader = async ({ params }: LoaderFunctionArgs) => {
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
    <div>
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
        classNames="max-w-3xl"
      />
    </div>
  )
}
