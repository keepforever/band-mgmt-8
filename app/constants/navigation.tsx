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
    to: '/events',
    icon: TempIcon,
    current: false,
  },
  // songs
  {
    name: 'Songs',
    to: '/songs',
    icon: TempIcon,
    current: false,
  },
  // venues
  {
    name: 'Venues',
    to: '/venues',
    icon: TempIcon,
    current: false,
  },

  {
    name: 'Setlists',
    to: '/setlists',
    icon: TempIcon,
    current: false,
  },

  {
    name: 'Invitations',
    to: '/invitations',
    icon: TempIcon,
    current: false,
  },

  {
    name: 'Availability',
    to: '/availability',
    icon: TempIcon,
    current: false,
  },
]

export const settingsNavigation = [
  {
    name: 'Blackout Days',
    to: '/settings/blackout-days',
    icon: TempIcon,
    current: false,
  },
  {
    name: 'Profile',
    to: '/settings/profile',
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
