import { Icon } from '#app/components/ui/icon.js'

export const TempIcon = ({ className }: { className?: string }) => {
  return (
    <Icon name="plus" className={className}>
      <span className="sr-only">plus</span>
    </Icon>
  )
}

export const navigation = [{ iconName: 'sun', name: 'Your Bands', to: '/bands' }]

export const bandSubNavigation = [
  {
    name: 'Events',
    to: '/events?futureOnly=true',
    toCreate: true,
    toCreateUrl: '/events/new',
    icon: TempIcon,
    current: false,
  },
  {
    name: 'Songs',
    to: '/songs',
    toCreate: true,
    toCreateUrl: '/songs/new',
    icon: TempIcon,
    current: false,
  },

  {
    name: 'Venues',
    to: '/venues',
    toCreateUrl: '/venues/new',
    toCreate: true,
    icon: TempIcon,
    current: false,
  },

  {
    name: 'Setlists',
    to: '/setlists',
    toCreateUrl: '/setlists/new',
    toCreate: true,
    icon: TempIcon,
    current: false,
  },
  {
    name: 'Techs',
    to: '/techs',
    toCreate: true,
    icon: TempIcon,
    toCreateUrl: '/techs/new',
    current: false,
  },
  {
    name: 'Availability',
    to: '/availability',
    toCreate: false,
    toCreateUrl: '',
    icon: TempIcon,
    current: false,
  },
  // {
  //   name: 'Invitations',
  //   to: '/invitations',
  //   toCreate: true,
  //   icon: TempIcon,
  //   current: false,
  // },
]

export const settingsNavigation = [
  {
    name: 'Profile',
    to: '/settings/profile',
    icon: TempIcon,
    current: false,
  },
  {
    name: 'Blackout Days',
    to: '/settings/blackout-days',
    icon: TempIcon,
    current: false,
  },
  {
    name: 'Invitations',
    to: '/settings/invitations',
    icon: TempIcon,
    current: false,
  },
]
