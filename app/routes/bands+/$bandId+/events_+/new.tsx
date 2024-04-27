// CreateEventForm.tsx
import { getFormProps, getInputProps, getSelectProps, useForm, getTextareaProps } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList, CheckboxField, TextareaField, SelectField } from '#app/components/forms.tsx'

import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const EventSchema = z.object({
  date: z.string().min(1, 'Event date is required'),
  location: z.string().min(1, 'Event location is required').optional(),
  name: z.string().min(1, 'Event name is required'),
  payment: z.number().int().min(0, 'Payment must be a positive number').optional(),
  requiresPASystem: z.boolean().optional(),
  startEndTime: z
    .string({ description: "i.e. 6pm - 9pm, or TBD if you don't know yet" })
    .min(3, 'A minimum of 3 characters is required for the start and end time'),
  venueId: z.string().min(1, 'Venue ID is required'),
  notes: z.string().max(1000).optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const bandId = params.bandId
  invariantResponse(userId, 'You must be logged in to create an event')

  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: EventSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { name, date, location, venueId, payment, startEndTime, requiresPASystem, notes } = submission.value

  await prisma.event.create({
    data: {
      name,
      date: new Date(date),
      location,
      payment,
      startEndTime,
      requiresPASystem: !!requiresPASystem,
      notes,
      venue: {
        connect: {
          id: venueId,
        },
      },
      bands: {
        create: [
          {
            bandId: bandId as string,
          },
        ],
      },
    },
  })

  return redirect(`/bands/${bandId}/events`)
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await requireUserId(request)
  const venues = await prisma.venue.findMany({
    where: {
      bands: {
        none: {
          bandId: userId,
        },
      },
    },
    select: {
      id: true,
      name: true,
      location: true,
    },
  })
  return json({ venues })
}

export default function CreateEventRoute() {
  const actionData = useActionData<typeof action>()
  const { venues } = useLoaderData<typeof loader>()
  const [form, fields] = useForm({
    id: 'create-event-form',
    constraint: getZodConstraint(EventSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: EventSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
  })

  const selectOptions = venues.map(venue => ({
    label: `${venue.name} - ${venue.location}`,
    value: venue.id,
  }))

  return (
    <div className="max-w-2xl">
      <Form method="POST" {...getFormProps(form)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-2 flex flex-wrap-reverse items-center justify-between gap-2">
          <h1 className="text-2xl font-bold">Create an Event</h1>

          <StatusButton className="col-span-2 mt-4" status={form.status ?? 'idle'} type="submit">
            Submit Event
          </StatusButton>
        </div>

        <CheckboxField
          className="col-span-1"
          labelProps={{
            htmlFor: fields.requiresPASystem.id,
            children: 'Requires PA System',
          }}
          buttonProps={getInputProps(fields.requiresPASystem, {
            type: 'checkbox',
          })}
          errors={fields.requiresPASystem.errors}
        />

        <SelectField
          className="col-span-2 sm:col-span-1"
          selectClassName="w-full"
          label="Venue"
          labelHtmlFor={getSelectProps(fields.venueId).id}
          options={[{ label: 'Select a Venue', value: '' }, ...selectOptions]}
          selectProps={getSelectProps(fields.venueId)}
          getOptionLabel={(option: { label: string; value: string }) => option.label}
          getOptionValue={(option: { label: string; value: string }) => option.value}
          errors={fields.venueId.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.startEndTime.id,
            children: 'Start and End Time',
          }}
          inputProps={getInputProps(fields.startEndTime, { type: 'text' })}
          errors={fields.startEndTime.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.name.id,
            children: 'Event Name',
          }}
          inputProps={{
            ...getInputProps(fields.name, { type: 'text' }),
            autoFocus: true,
          }}
          errors={fields.name.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.date.id,
            children: 'Event Date',
          }}
          inputProps={getInputProps(fields.date, { type: 'date' })}
          errors={fields.date.errors}
        />

        <Field
          className="col-span-2 sm:col-span-1"
          labelProps={{
            htmlFor: fields.payment.id,
            children: 'Payment',
          }}
          inputProps={getInputProps(fields.payment, { type: 'number' })}
          errors={fields.payment.errors}
        />

        <TextareaField
          className="col-span-2"
          labelProps={{ children: 'Notes' }}
          textareaProps={{
            ...getTextareaProps(fields.notes),
          }}
          errors={fields.notes.errors}
        />

        <br />
        <ErrorList className="col-span-2" errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
