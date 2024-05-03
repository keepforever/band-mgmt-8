import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node'
import { Form, useActionData, useParams } from '@remix-run/react'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { requireUserId } from '#app/utils/auth.server'
import { prisma } from '#app/utils/db.server.ts'

const InvitationSchema = z.object({
  inviteeId: z.string().min(1, 'Invitee is required'),
  bandId: z.string().min(1, 'Band is required'),
})

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request)
  invariantResponse(userId, 'You must be logged in to create an invitation')

  const formData = await request.formData()
  const submission = await parseWithZod(formData, { schema: InvitationSchema })
  if (submission.status !== 'success') {
    return json({ result: submission.reply() }, { status: submission.status === 'error' ? 400 : 200 })
  }
  const { inviteeId, bandId } = submission.value

  try {
    await prisma.invitation.create({
      data: {
        inviterId: userId,
        inviteeId,
        bandId,
        status: 'pending',
      },
    })
  } catch (error) {
    console.error('\n', `error = `, error, '\n')
    return json(
      {
        result: submission.reply({
          formErrors: ['An error occurred while creating the invitation'],
        }),
      },
      { status: 400 },
    )
  }

  return redirect(`/bands/${bandId}/invitations`)
}

// The loader might not be necessary for creating an invitation unless you're pre-loading data (e.g., band list)

export default function CreateInvitationRoute() {
  const actionData = useActionData<typeof action>()
  const params = useParams()

  const [form, fields] = useForm({
    id: 'create-invitation-form',
    constraint: getZodConstraint(InvitationSchema),
    lastResult: actionData?.result,
    onValidate({ formData }) {
      const result = parseWithZod(formData, { schema: InvitationSchema })
      return result
    },
    shouldRevalidate: 'onBlur',
    defaultValue: {
      inviteeId: '',
      bandId: params.bandId,
    },
  })

  return (
    <div className="max-w-md">
      <h1 className="text-center text-body-lg font-bold">Invite a Band Member</h1>

      <Form method="POST" {...getFormProps(form)} className="mt-6">
        <Field
          labelProps={{
            htmlFor: fields.inviteeId.id,
            children: 'Invitee',
          }}
          inputProps={{
            ...getInputProps(fields.inviteeId, { type: 'text' }),
          }}
          errors={fields.inviteeId.errors}
        />

        <input className="hidden" {...getInputProps(fields.bandId, { type: 'text' })} />

        <StatusButton className="mt-4 w-full" status={form.status ?? 'idle'} type="submit">
          Send Invitation
        </StatusButton>

        <br />

        <ErrorList errors={form.errors} id={form.errorId} />
      </Form>
    </div>
  )
}
