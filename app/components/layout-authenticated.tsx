import { Dialog, Transition } from '@headlessui/react'
import { Link, NavLink, useNavigation, useParams, useRouteLoaderData } from '@remix-run/react'
import { Fragment, useEffect, useState } from 'react'
import { Icon } from '#app/components/ui/icon.js'
import { bandSubNavigation, settingsNavigation } from '#app/constants/navigation.js'
import { useMediaQuery } from '#app/hooks/useMediaQuery.js'
import { type loader as rootLoader } from '#app/root.tsx'
import { cn, getUserImgSrc } from '#app/utils/misc.js'
import { useUser } from '#app/utils/user.js'
import { Breadcrumbs } from './breadcrumbs'
import { LogoutButton } from './logout-button'

const getLinkCss = (isActive: boolean) =>
  cn(
    'inline-flex items-center rounded-md px-2 py-1 text-button font-semibold hover:bg-status-info hover:text-status-info-foreground',
    {
      'rounded-bl-none rounded-br-none border-b-2 border-border dark:border-accent-two': isActive,
      'text-foreground': !isActive,
    },
  )

export function LayoutAuthenticated({
  children,
  themeSwitch,
}: {
  children: React.ReactNode
  themeSwitch: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const routerNavigation = useNavigation()
  const data = useRouteLoaderData<typeof rootLoader>('root')
  const params = useParams()
  const user = useUser()
  const userBands =
    data?.user?.bands?.map(band => ({
      id: band.band.id,
      name: band.band.name,
      to: `/bands/${band.band.id}`,
      initial: band.band.name[0],
      current: params.bandId === band.band.id,
    })) ?? []

  // close the sidebar when the route changes
  useEffect(() => {
    if (sidebarOpen && routerNavigation.state === 'loading') {
      setSidebarOpen(false)
    }
  }, [routerNavigation.state, sidebarOpen])

  const isSmallScreen = useMediaQuery('(max-width: 1022px)')

  return (
    <div>
      {/* Mobile Slid-out Nav */}

      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-background" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                      <span className="sr-only">Close sidebar</span>

                      <Icon name="cross-1" className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component, swap this element with another sidebar if you like */}

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-muted px-6 pb-2">
                  <div className="flex items-center gap-2 pt-3">
                    <img
                      className="h-8 w-8 rounded-full object-cover"
                      alt={user.name ?? user.username}
                      src={getUserImgSrc(user.image?.id)}
                    />

                    <span className="text-body-xs font-bold text-foreground">{user.name ?? user.username}</span>
                  </div>

                  <nav className="flex flex-1 flex-col">
                    <ul className="flex flex-1 flex-col gap-y-7">
                      {/* Your Bands */}

                      <UserBands />

                      {/* Settings */}

                      <UserSettings />
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}

      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 px-6">
          <div className="flex h-16 shrink-0 items-center">
            <Link to="/" className="h-8 w-auto">
              <p className="text-2xl font-bold text-foreground-destructive">MGMT</p>
            </Link>

            {!isSmallScreen && themeSwitch}

            <NavLink
              to="/assets"
              className={({ isActive }) =>
                cn({
                  'bg-primary text-primary-foreground': isActive,
                  'text-foreground': !isActive,
                })
              }
            >
              Assets
            </NavLink>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              {/* Your Bands */}

              <UserBands />

              {/* Settings */}

              <UserSettings />
            </ul>
          </nav>
        </div>
      </div>

      {/* Static Mobile Navbar */}

      <div className="sticky top-0 z-40 flex items-center justify-between gap-x-2 bg-background/90 px-4 py-2 shadow-sm sm:px-6 lg:hidden">
        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>

          <Icon name="hamburger-menu" className="h-6 w-6 stroke-foreground" aria-hidden="true" />
        </button>
        <Link
          to="/bands"
          className="text-sm font-semibold leading-6 text-foreground hover:text-hyperlink-hover hover:underline"
        >
          Dashboard
        </Link>

        <NavLink
          to="/assets"
          className={({ isActive }) =>
            cn({
              'bg-primary text-primary-foreground': isActive,
              'text-foreground': !isActive,
            })
          }
        >
          Assets
        </NavLink>

        {isSmallScreen && themeSwitch}

        <Link to={`/settings/profile`} className="flex flex-col items-center gap-2 sm:hidden">
          <img
            className="h-8 w-8 rounded-full object-cover"
            alt={user.name ?? user.username}
            src={getUserImgSrc(user.image?.id)}
          />
          <span className="sr-only">{user.name ?? user.username}</span>
        </Link>
      </div>

      <main className="py-3 lg:pl-60">
        <div className="flex flex-1 gap-x-1 overflow-x-auto overflow-y-hidden px-3 pb-3 sm:hidden">
          {userBands.map(band => (
            <Fragment key={band.name}>
              {bandSubNavigation.map(item => (
                <NavLink
                  key={item.name}
                  to={`${band.to}${item.to}`}
                  // className={({ isActive }) =>
                  //   cn('flex items-center gap-1.5 text-body-2xs hover:underline', {
                  //     'tracking-widest underline': isActive,
                  //     'text-foreground hover:text-hyperlink-hover': !isActive,
                  //   })
                  // }
                  className={({ isActive }) => cn(getLinkCss(isActive))}
                >
                  {item.name}
                </NavLink>
              ))}
            </Fragment>
          ))}
        </div>

        <Breadcrumbs />

        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}

const UserBands = () => {
  const data = useRouteLoaderData<typeof rootLoader>('root')
  const params = useParams()
  const userBands =
    data?.user?.bands?.map(band => ({
      id: band.band.id,
      name: band.band.name,
      to: `/bands/${band.band.id}`,
      initial: band.band.name[0],
      current: params.bandId === band.band.id,
    })) ?? []

  return (
    <li>
      <ul className="-mx-2 mt-2 space-y-1">
        {userBands.map(band => (
          <li key={band.name}>
            <NavLink to={band.to} className={({ isActive }) => getLinkCss(isActive)}>
              <span className="truncate">{band.name}</span>
            </NavLink>

            <ul className="ml-4 mt-2">
              {bandSubNavigation.map(item => {
                return (
                  <li key={item.name} className="flex items-center gap-1.5 rounded-md p-1">
                    <NavLink
                      title={`Navigate to ${item.name} list`}
                      to={`${band.to}${item.to}`}
                      className={({ isActive }) => getLinkCss(isActive)}
                    >
                      {item.name}
                    </NavLink>

                    {item.toCreate && (
                      <Link
                        title={`Create new ${item.name}`}
                        to={`${band.to}${item.to}/new`}
                        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-button font-semibold transition-all duration-300 ease-in-out hover:bg-status-info hover:text-accent-foreground"
                      >
                        <Icon name="pencil-2" className="h-4 w-4" />
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </li>
  )
}

const UserSettings = () => {
  return (
    <li>
      <div className="text-xs font-semibold leading-6 text-foreground">Your Settings</div>
      <ul className="ml-2 mt-2 space-y-1">
        {settingsNavigation.map(item => (
          <li key={item.name}>
            <NavLink to={item.to} className={({ isActive }) => getLinkCss(isActive)}>
              <span className="truncate">{item.name}</span>
            </NavLink>
          </li>
        ))}
        <li>
          <LogoutButton />
        </li>
      </ul>
    </li>
  )
}
