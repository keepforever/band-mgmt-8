import { cn, getUserImgSrc } from '#app/utils/misc.tsx'

interface UserCardProps {
  name: string | null
  imageId: string | null
  isPending: boolean
  instrument?: string
}

export const UserCard: React.FC<UserCardProps> = ({ instrument, name, imageId, isPending }) => {
  return (
    <li
      className={cn('inline-flex items-center overflow-hidden rounded-lg bg-muted', {
        'opacity-50': isPending,
      })}
    >
      <div className="flex flex-col">
        <div className="w-full bg-destructive px-1.5 py-1 text-body-xs font-semibold tracking-wider text-destructive-foreground">
          Unavailable
        </div>
        {/* Image */}

        <div className="flex items-center px-1.5 pb-1">
          <img alt={name ?? instrument} src={getUserImgSrc(imageId)} className="mr-3 h-16 w-16 rounded-full" />

          {/* Name */}

          <div className="flex flex-col">
            {name ? <span className="overflow-hidden text-ellipsis whitespace-nowrap text-body-sm">{name}</span> : null}

            <span className="overflow-hidden text-ellipsis text-body-sm text-muted-foreground">{instrument}</span>
          </div>
        </div>
      </div>
    </li>
  )
}
