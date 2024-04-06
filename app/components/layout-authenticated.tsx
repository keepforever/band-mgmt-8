import { Dialog, Transition } from '@headlessui/react'
import { Link, NavLink } from '@remix-run/react'
import { Fragment, useState } from 'react'
import { Icon } from '#app/components/ui/icon.js'
import { navigation } from '#app/constants/navigation.js'
import { cn } from '#app/utils/misc.js'
import { LogoutButton } from './logout-button'

const teams = [
  { id: 1, name: 'Heroicons', href: '#', initial: 'H', current: false },
  { id: 2, name: 'Tailwind Labs', href: '#', initial: 'T', current: false },
  { id: 3, name: 'Workcation', href: '#', initial: 'W', current: false },
]

export function LayoutAuthenticated({
  children,
  themeSwitch,
}: {
  children: React.ReactNode
  themeSwitch: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div>
      {/* Mobile */}

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
            <div className="fixed inset-0 bg-gray-900/80" />
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
                      <Icon name="camera" className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                  <div className="flex h-16 shrink-0 items-center">
                    <img className="h-8 w-auto" src="/img/user.png" alt="Your Company" />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul className="-mx-2 space-y-1">
                          {navigation.map(item => (
                            <li key={item.name}>
                              <NavLink
                                to={item.to}
                                className={({ isActive }) =>
                                  cn({
                                    'bg-primary text-primary-foreground': isActive,
                                    'bg-background text-foreground': !isActive,
                                  })
                                }
                              >
                                {item.name}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li>
                        <div className="text-xs font-semibold leading-6 text-gray-400">Your teams</div>
                        <ul className="-mx-2 mt-2 space-y-1">
                          {teams.map(team => (
                            <li key={team.name}>
                              <a
                                href={team.href}
                                className={cn(
                                  team.current
                                    ? 'bg-gray-50 text-indigo-600'
                                    : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                                  'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                                )}
                              >
                                <span
                                  className={cn(
                                    team.current
                                      ? 'border-indigo-600 text-indigo-600'
                                      : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600',
                                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                                  )}
                                >
                                  {team.initial}
                                </span>
                                <span className="truncate">{team.name}</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </li>
                      <li>
                        <LogoutButton />
                      </li>
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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-background px-6">
          <div className="flex h-16 shrink-0 items-center">
            <img className="h-8 w-auto" src="/img/user.png" alt="Your Company" />
            {themeSwitch}
            <Link to="/login">Log In</Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="-mx-2 space-y-1">
                  {navigation.map(item => (
                    <li key={item.name}>
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn({
                            'bg-primary text-primary-foreground': isActive,
                            'bg-background text-foreground': !isActive,
                          })
                        }
                      >
                        {item.name}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <div className="text-xs font-semibold leading-6 text-gray-400">Your teams</div>
                <ul className="-mx-2 mt-2 space-y-1">
                  {teams.map(team => (
                    <li key={team.name}>
                      <a
                        href={team.href}
                        className={cn(
                          team.current
                            ? 'bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                          'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6',
                        )}
                      >
                        <span
                          className={cn(
                            team.current
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-gray-200 text-gray-400 group-hover:border-indigo-600 group-hover:text-indigo-600',
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border bg-white text-[0.625rem] font-medium',
                          )}
                        >
                          {team.initial}
                        </span>
                        <span className="truncate">{team.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <a
                  href="https://tailwindui.com"
                  className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50"
                >
                  <img className="h-8 w-8 rounded-full bg-gray-50" src="/img/user.png" alt="" />
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true">Tom Cook</span>
                </a>
              </li>
              <li>
                <LogoutButton />
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <Icon name="sun" className="h-6 w-6" aria-hidden="true" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">Dashboard</div>
        <a href="https://tailwindui.com" className="flex items-center gap-x-4">
          <span className="sr-only">Your profile</span>
          <img className="h-8 w-8 rounded-full bg-gray-500" src="/img/user.png" alt="" />
        </a>
      </div>

      <main className="py-10 lg:pl-60">
        <div className="px-4 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
