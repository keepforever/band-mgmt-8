import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  json,
  type LoaderFunctionArgs,
  type ActionFunctionArgs,
  type HeadersFunction,
  type LinksFunction,
  type MetaFunction,
} from '@remix-run/node'
import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData, useMatches } from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { LayoutAuthenticated } from './components/layout-authenticated.tsx'
import { Logo } from './components/logo.tsx'
import { EpicProgress } from './components/progress-bar.tsx'
import { SearchBar } from './components/search-bar.tsx'
import { ThemeSwitch } from './components/theme-switch.tsx'
import { useToast } from './components/toaster.tsx'
import { Button } from './components/ui/button.tsx'
import { href as iconsHref } from './components/ui/icon.tsx'
import { EpicToaster } from './components/ui/sonner.tsx'
import { UserDropdown } from './components/user-dropdown.tsx'
import { useTheme } from './hooks/useTheme.ts'
import { ThemeFormSchema } from './schemas/theme-form-schema.ts'
import tailwindStyleSheetUrl from './styles/tailwind.css?url'
import { getUserId, logout } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme, setTheme, getTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'
import { useOptionalUser } from './utils/user.ts'

export const links: LinksFunction = () => {
  return [
    // Preload svg sprite as a resource to avoid render blocking
    { rel: 'preload', href: iconsHref, as: 'image' },
    // Preload CSS as a resource to avoid render blocking
    { rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
    {
      rel: 'alternate icon',
      type: 'image/png',
      href: '/favicons/favicon-32x32.png',
    },
    { rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
      crossOrigin: 'use-credentials',
    } as const, // necessary to make typescript happy
    //These should match the css preloads above to avoid css as render blocking resource
    { rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
    { rel: 'stylesheet', href: tailwindStyleSheetUrl },
  ].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data ? 'Epic Notes' : 'Error | Epic Notes' },
    { name: 'description', content: `Your own captain's log` },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const timings = makeTimings('root loader')
  const userId = await time(() => getUserId(request), {
    timings,
    type: 'getUserId',
    desc: 'getUserId in root',
  })

  const user = userId
    ? await time(
        () =>
          prisma.user.findUniqueOrThrow({
            select: {
              id: true,
              name: true,
              username: true,
              image: { select: { id: true } },
              roles: {
                select: {
                  name: true,
                  permissions: {
                    select: { entity: true, action: true, access: true },
                  },
                },
              },
              bands: {
                select: {
                  isAdmin: true,
                  band: {
                    select: {
                      name: true,
                      id: true,
                    },
                  },
                },
              },
            },
            where: { id: userId },
          }),
        { timings, type: 'find user', desc: 'find user in root' },
      )
    : null

  if (userId && !user) {
    console.info('something weird happened')
    // something weird happened... The user is authenticated but we can't find
    // them in the database. Maybe they were deleted? Let's log them out.
    await logout({ request, redirectTo: '/' })
  }
  const { toast, headers: toastHeaders } = await getToast(request)
  const honeyProps = honeypot.getInputProps()

  return json(
    {
      user,
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: getTheme(request),
        },
      },
      ENV: getEnv(),
      toast,
      honeyProps,
    },
    {
      headers: combineHeaders({ 'Server-Timing': timings.toString() }, toastHeaders),
    },
  )
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  const headers = {
    'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
  }
  return headers
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: ThemeFormSchema,
  })

  invariantResponse(submission.status === 'success', 'Invalid theme received')

  const { theme } = submission.value

  const responseInit = {
    headers: { 'set-cookie': setTheme(theme) },
  }
  return json({ result: submission.reply() }, responseInit)
}

function Document({
  children,
  nonce,
  theme = 'light',
  env = {},
  allowIndexing = true,
}: {
  children: React.ReactNode
  nonce: string
  theme?: Theme
  env?: Record<string, string>
  allowIndexing?: boolean
}) {
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        {allowIndexing ? null : <meta name="robots" content="noindex, nofollow" />}
        <Links />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

function App() {
  const data = useLoaderData<typeof loader>()
  const nonce = useNonce()
  const user = useOptionalUser()
  const theme = useTheme()
  const matches = useMatches()
  const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
  const searchBar = isOnSearchPage ? null : <SearchBar status="idle" />
  const allowIndexing = data.ENV.ALLOW_INDEXING !== 'false'
  useToast(data.toast)

  return (
    <Document nonce={nonce} theme={theme} allowIndexing={allowIndexing} env={data.ENV}>
      {user ? (
        <LayoutAuthenticated themeSwitch={<ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />}>
          <Outlet />
        </LayoutAuthenticated>
      ) : (
        <div className="flex h-screen flex-col justify-between">
          <header className="container py-6">
            <nav className="flex flex-wrap items-center justify-between gap-4 sm:flex-nowrap md:gap-8">
              <Logo />
              <div className="ml-auto hidden max-w-sm flex-1 sm:block">{searchBar}</div>
              <div className="flex items-center gap-10">
                {user ? (
                  <UserDropdown />
                ) : (
                  <Button asChild variant="default" size="lg">
                    <Link to="/login">Log In</Link>
                  </Button>
                )}
              </div>
              <div className="block w-full sm:hidden">{searchBar}</div>
            </nav>
          </header>

          <div className="flex-1">
            <Outlet />
          </div>

          <div className="container flex justify-between pb-5">
            <Logo />
            <ThemeSwitch userPreference={data.requestInfo.userPrefs.theme} />
          </div>
        </div>
      )}

      <EpicToaster closeButton position="top-center" theme={theme} />
      <EpicProgress />
    </Document>
  )
}

function AppWithProviders() {
  const data = useLoaderData<typeof loader>()
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  )
}

export default withSentry(AppWithProviders)

export function ErrorBoundary() {
  // the nonce doesn't rely on the loader so we can access that
  const nonce = useNonce()

  // NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
  // likely failed to run so we have to do the best we can.
  // We could probably do better than this (it's possible the loader did run).
  // This would require a change in Remix.

  // Just make sure your root route never errors out and you'll always be able
  // to give the user a better UX.

  return (
    <Document nonce={nonce}>
      <GeneralErrorBoundary />
    </Document>
  )
}
