// TechDetails.tsx
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, type ActionFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { Button } from '#app/components/ui/button.js'
import { Icon } from '#app/components/ui/icon.js'
import { StatusButton } from '#app/components/ui/status-button.js'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server'
import { useDoubleCheck } from '#app/utils/misc'
import { redirectWithToast } from '#app/utils/toast.server.js'

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  invariantResponse(userId, 'Unauthorized access')
  const techId = params.techId

  const tech = await prisma.tech.findUnique({
    where: { id: techId },
    include: {
      serviceType: {
        select: {
          name: true,
        },
      },
      bands: {
        select: {
          bandId: true,
          band: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  if (!tech) throw new Error('Tech not found')

  return json({ tech })
}

export default function TechDetails() {
  const { tech } = useLoaderData<typeof loader>()

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap justify-between gap-2 px-4 sm:px-0">
        <h3 className="text-lg font-semibold leading-7">{tech?.name}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`../edit`} className="text-hyperlink hover:underline">
            <Button size="sm">Edit Tech</Button>
          </Link>

          <DeleteTech />
        </div>
      </div>

      <div className="mt-6 border-t border-border">
        <dl className="divide-y divide-border">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Name</dt>
            <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">{tech?.name}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Service Type</dt>
            <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">{tech?.serviceType.name}</dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
            <dt className="text-sm font-medium leading-6">Contact Info</dt>
            <dd className="mt-1 text-sm leading-6 text-foreground sm:col-span-2 sm:mt-0">
              <ul className="divide-y divide-border">
                <li className="py-1">
                  <a
                    href={`mailto:${tech?.email}`}
                    className="mt-1 text-sm leading-6 text-hyperlink hover:text-hyperlink-hover"
                  >
                    {tech?.email}
                  </a>
                </li>
                <li className="py-1">
                  <a
                    href={`tel:${tech?.phone}`}
                    className="mt-1 text-sm leading-6 text-hyperlink hover:text-hyperlink-hover"
                  >
                    {tech?.phone}
                  </a>
                </li>
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function DeleteTech() {
  const dc = useDoubleCheck()
  const fetcher = useFetcher()
  const { tech } = useLoaderData<typeof loader>()
  const techId = tech?.id

  return (
    <fetcher.Form method="post">
      <input type="hidden" name="intent" value="deleteTech" />
      <input type="hidden" name="techId" value={techId} />
      <input type="hidden" name="bandId" value={tech?.bands[0].bandId} />
      <StatusButton
        {...dc.getButtonProps({
          type: 'submit',
        })}
        variant={dc.doubleCheck ? 'destructive' : 'destructive'}
        status={fetcher.state !== 'idle' ? 'pending' : fetcher?.state ?? 'idle'}
        size="sm"
      >
        <Icon name="trash">{dc.doubleCheck ? `Are you sure?` : `Delete Tech`}</Icon>
      </StatusButton>
    </fetcher.Form>
  )
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const techId = formData.get('techId') as string
  const intent = formData.get('intent')
  const bandId = params.bandId

  invariantResponse(techId, 'Tech ID is required')
  invariantResponse(intent, 'Intent is required')
  invariantResponse(bandId, 'Band ID is required')

  if (intent !== 'deleteTech') {
    return json({ success: false, message: 'Invalid intent.' }, { status: 400 })
  }

  await prisma.tech.delete({
    where: { id: techId },
  })

  const redirectPath = `/bands/${bandId}/techs`

  return redirectWithToast(redirectPath, {
    type: 'success',
    title: 'Tech Deleted',
    description: 'The tech has been deleted successfully.',
  })
}
