import { invariantResponse } from '@epic-web/invariant'
import { type SEOHandle } from '@nasa-gcn/remix-seo'
import { json, type LoaderFunctionArgs } from '@remix-run/node'
import { Outlet } from '@remix-run/react'
import { z } from 'zod'
import { Spacer } from '#app/components/spacer.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { requireUserId } from '#app/utils/auth.server.ts'
import { prisma } from '#app/utils/db.server.ts'

export const BreadcrumbHandle = z.object({ breadcrumb: z.any() })
export type BreadcrumbHandle = z.infer<typeof BreadcrumbHandle>

export const handle: BreadcrumbHandle & SEOHandle = {
  breadcrumb: <Icon name="file-text">Edit Profile</Icon>,
  getSitemapEntries: () => null,
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  })
  invariantResponse(user, 'User not found', { status: 404 })
  return json({})
}

export default function EditUserProfile() {
  return (
    <div className="max-w-5xl">
      <Spacer size="4xs" />
      <main className="mx-auto bg-muted px-6 py-8 md:container md:rounded-3xl">
        <Outlet />
      </main>
    </div>
  )
}
