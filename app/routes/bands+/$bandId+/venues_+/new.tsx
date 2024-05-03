// CreateVenueForm.tsx
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const VenueSchema = z
  .object({
    name: z.string().min(1, 'Venue name is required'),
    location: z.string().min(1, 'Location is required'),
    capacity: z.number().optional(),
    contactName: z.string().min(1, 'Contact name is required').optional(),
    contactEmail: z.string().email('Invalid email address').optional(),
    contactPhone: z.string().min(1, 'Contact phone is required').optional(),
    contactIncomplete: z.string().optional(),
  })
  .refine(
    data => {
      // If contactName is filled out, at least one of contactEmail or contactPhone should be filled out
      if (data.contactName) {
        return Boolean(data.contactEmail) || Boolean(data.contactPhone)
      }
      // If contactName is not filled out, it's valid
      return true
    },
    {
      // Custom error message
      message: 'At least one of phone or email must be filled out if name is provided',
      path: ['contactIncomplete'],
    },
  )

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)

  const bandId = params.bandId
  invariantResponse(userId, 'You must be logged in to create a venue')

  const formData = await request.formData()
  const submission = parseWithZod(formData, { schema: VenueSchema })
  if (submission.status !== 'success') {
    console.error('Form errors:', submission.reply())

    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { name, location, capacity, contactEmail, contactName, contactPhone } = submission.value

  const hasFullContactInfo = contactName && (contactEmail || contactPhone)

  await prisma.venue.create({
    data: {
      name,
      location,
      capacity,
      ...(hasFullContactInfo && {
        contacts: {
          create: [
            {
              name: contactName,
              email: contactEmail,
              phone: contactPhone,
              status: 'active',
            },
          ],
        },
      }),
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

  return json({})
}

export default function CreateVenueRoute() {
  const actionData = useActionData<typeof action>()

  const [form, fields] = useForm({
    id: 'create-venue-form',
    constraint: getZodConstraint(VenueSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: VenueSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
  })

  return (
    <div className="max-w-2xl">
      <Form
        method="POST"
        encType="multipart/form-data"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
        {...getFormProps(form)}
      >
        <div className="col-span-2 flex flex-wrap-reverse items-center justify-between gap-2">
          <h1 className="text-body-lg font-bold">Create a Venue</h1>

          <StatusButton className="col-span-2 mt-4" status={form.status ?? 'idle'} type="submit">
            Submit Venue
          </StatusButton>
        </div>
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
          className="col-span-2 sm:col-span-1"
        />
        <Field
          labelProps={{
            htmlFor: fields.location.id,
            children: 'Location',
          }}
          inputProps={getInputProps(fields.location, { type: 'text' })}
          errors={fields.location.errors}
          className="col-span-2 sm:col-span-1"
        />
        <Field
          labelProps={{
            htmlFor: fields.capacity.id,
            children: 'Capacity',
          }}
          inputProps={getInputProps(fields.capacity, { type: 'number' })}
          errors={fields.capacity.errors}
          className="col-span-2 sm:col-span-1"
        />

        <Field
          labelProps={{
            htmlFor: fields.contactName.id,
            children: 'Contact Name',
          }}
          inputProps={getInputProps(fields.contactName, { type: 'text' })}
          errors={fields.contactName.errors}
          className="col-span-2 sm:col-span-1"
        />

        <Field
          labelProps={{
            htmlFor: fields.contactEmail.id,
            children: 'Contact Email',
          }}
          inputProps={getInputProps(fields.contactEmail, { type: 'email' })}
          errors={fields.contactEmail.errors || fields.contactIncomplete.errors}
          className="col-span-2 sm:col-span-1"
        />

        <Field
          labelProps={{
            htmlFor: fields.contactPhone.id,
            children: 'Contact Phone',
          }}
          inputProps={getInputProps(fields.contactPhone, { type: 'text' })}
          errors={fields.contactPhone.errors || fields.contactIncomplete.errors}
          className="col-span-2 sm:col-span-1"
        />

        <br />

        <ErrorList errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
