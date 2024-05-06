import { getFormProps, getInputProps, getSelectProps, getTextareaProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { type LoaderFunctionArgs, json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { Field, ErrorList, CheckboxField, TextareaField, SelectField } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'
import { TechIdsSchema } from './new'

const EventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  date: z.string().min(1, 'Event date is required'),
  venueId: z.string().min(1, 'Venue ID is required'),
  payment: z.number().int().min(0, 'Payment must be a positive number').optional(),
  requiresPASystem: z.boolean().optional(),
  startEndTime: z.string().min(3, 'A minimum of 3 characters is required for the start and end time'),
  notes: z.string().max(1000).optional(),
})

export async function action({ request, params }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  const bandId = params.bandId
  const eventId = params.eventId

  invariantResponse(userId, 'You must be logged in to perform this action')
  invariantResponse(bandId, 'Missing band ID')
  invariantResponse(eventId, 'Missing event ID')

  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: EventSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }

  const { name, date, venueId, payment, requiresPASystem, startEndTime, notes } = submission.value

  const techIds = formData.getAll('techIds') as Array<string>
  let validTechIds = false

  try {
    TechIdsSchema.parse(techIds)
    validTechIds = true
  } catch (error) {
    console.error('Invalid techIds:', error)
  }

  try {
    if (validTechIds) {
      await prisma.eventTech.deleteMany({
        where: {
          eventId,
        },
      })

      await prisma.eventTech.createMany({
        data: techIds.map(techId => ({
          eventId,
          techId,
        })),
      })
    }
  } catch (error) {
    console.error('Invalid techIds:', error)
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      name,
      notes,
      payment,
      startEndTime,
      requiresPASystem,
      date: new Date(date),
      venue: {
        connect: {
          id: venueId,
        },
      },
    },
  })

  return redirect(`/bands/${bandId}/events`)
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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

  const eventId = params.eventId

  const techs = await prisma.tech.findMany({
    select: {
      id: true,
      name: true,
      serviceType: {
        select: {
          name: true,
        },
      },
    },
  })

  const event = await prisma.event?.findUnique({
    where: {
      id: eventId,
    },
    include: {
      venue: true,
      bands: true,
      EventTech: {
        select: {
          tech: {
            select: {
              id: true,
              name: true,
              serviceType: {
                select: {
                  name: true,
                  description: true,
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return json({ venues, event, techs })
}

export default function EditEventRoute() {
  const actionData = useActionData<typeof action>()
  const { venues, event, techs } = useLoaderData<typeof loader>()

  const [techIds, setTechIds] = useState<string[]>(() => {
    return event?.EventTech.map(eventTech => eventTech.tech.id) ?? []
  })
  const [form, fields] = useForm({
    id: 'edit-event-form',
    constraint: getZodConstraint(EventSchema),
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: EventSchema })
      return result
    },
    lastResult: actionData?.result,

    defaultValue: event
      ? {
          name: event.name,
          date: event.date.split('T')[0], // Assuming date is stored in ISO format
          venueId: event.venue?.id,
          payment: event.payment,
          requiresPASystem: event.requiresPASystem,
          startEndTime: event.startEndTime,
          notes: event.notes,
        }
      : {},
    shouldRevalidate: 'onBlur',
  })

  const selectOptions = venues.map(venue => ({
    label: `${venue.name} - ${venue.location}`,
    value: venue.id,
  }))

  const techOptions = techs
    .map(tech => ({
      label: `${tech.name} - ${tech.serviceType.name}`,
      value: tech.id,
    }))
    .filter(
      tech => !event?.EventTech.some(eventTech => eventTech.tech.id === tech.value) && !techIds.includes(tech.value),
    )

  return (
    <div className="max-w-2xl">
      <Form method="POST" {...getFormProps(form)} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="col-span-2 flex flex-wrap-reverse items-center justify-between gap-2">
          <h1 className="text-body-lg font-bold">Edit {event?.name}</h1>

          <StatusButton className="col-span-2 mt-4" status={form.status ?? 'idle'} type="submit">
            Update Event
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

        <SelectField
          label="Add a Technician"
          className="col-span-2"
          selectClassName="w-full"
          options={[{ label: 'Select a Tech', value: '' }, ...techOptions]}
          getOptionLabel={(option: { label: string; value: string }) => option.label}
          getOptionValue={(option: { label: string; value: string }) => option.value}
          selectProps={{
            onChange: e => setTechIds(prevTechIds => [...prevTechIds, e.target.value]),
          }}
        />

        {/* Selected Techs */}

        <div className="col-span-2 flex flex-col gap-2">
          <h2 className={`text-body-lg font-bold ${techIds.length ? 'block' : 'hidden'}`}>Tech List</h2>
          <div className="flex flex-wrap gap-2">
            {techIds.map(techId => {
              const tech = techs.find(tech => tech.id === techId)
              return (
                <div key={techId} className="relative col-span-2 rounded-lg bg-muted shadow-md">
                  <button
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    onClick={() => setTechIds(prevTechIds => prevTechIds.filter(id => id !== techId))}
                  >
                    X
                  </button>
                  <div className="p-2">
                    <p className="text-lg font-bold">{tech?.name}</p>
                    <p className="text-muted-foreground">{tech?.serviceType.name}</p>
                  </div>
                  <input className="hidden" name="techIds" value={techId} readOnly />
                </div>
              )
            })}
          </div>
        </div>

        <br />
        <ErrorList className="col-span-2" errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}

// if (techId) {
//   await prisma.eventTech.upsert({
//     where: {
//       eventId_techId: {
//         eventId: eventId,
//         techId: techId,
//       },
//     },
//     update: {},
//     create: {
//       eventId: eventId,
//       techId: techId,
//     },
//   })
// }
