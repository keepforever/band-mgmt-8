// CreateVenueForm.tsx
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const VenueSchema = z.object({
  name: z.string().min(1, 'Venue name is required'),
  location: z.string().min(1, 'Location is required'),
  capacity: z.number().optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)

  const bandId = params.bandId
  invariantResponse(userId, 'You must be logged in to create a venue')

  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: VenueSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { name, location, capacity } = submission.value

  await prisma.venue.create({
    data: {
      name,
      location,
      capacity,
      bands: {
        create: [
          {
            band: {
              connect: {
                id: bandId,
              },
            },
          },
        ],
      },
    },
  })

  return redirect(`/bands/${bandId}/venues`)
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await requireUserId(request)

  const venue = await prisma.venue.findUnique({
    where: {
      id: params.venueId,
    },
    include: {
      events: true,
      bands: true,
    },
  })
  return json({ venue })
}

export default function CreateVenueRoute() {
  const actionData = useActionData<typeof action>()
  const loaderData = useLoaderData<typeof loader>()

  const [form, fields] = useForm({
    id: 'create-venue-form',
    constraint: getZodConstraint(VenueSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: VenueSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
    defaultValue: {
      capacity: loaderData?.venue?.capacity ?? null,
      location: loaderData?.venue?.location ?? '',
      name: loaderData?.venue?.name ?? '',
    },
  })

  return (
    <div className="container mx-auto max-w-md">
      <h1 className="text-center text-2xl font-bold">Submit a New Venue</h1>

      <Form method="POST" {...getFormProps(form)} className="mt-6">
        <Field
          labelProps={{
            htmlFor: fields.name.id,
            children: 'Venue Name',
          }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            autoFocus: true,
          }}
          errors={fields.name.errors}
        />
        <Field
          labelProps={{
            htmlFor: fields.location.id,
            children: 'Location',
          }}
          inputProps={getInputProps(fields.location, { type: 'text' })}
          errors={fields.location.errors}
        />
        <Field
          labelProps={{
            htmlFor: fields.capacity.id,
            children: 'Capacity',
          }}
          inputProps={getInputProps(fields.capacity, { type: 'number' })}
          errors={fields.capacity.errors}
        />
        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Submit Venue
        </StatusButton>
        <br />
        <ErrorList errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
