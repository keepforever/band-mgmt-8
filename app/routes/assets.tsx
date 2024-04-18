import { Icon, iconNameArray } from '#app/components/ui/icon.js'

export default function Assets() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="mb-4 text-3xl font-semibold text-foreground">Assets</h1>

      {/* Icons */}

      <div>
        <div className="bg-primary">
          <h2 className="mb-2 text-xl font-semibold text-primary-foreground">Icons</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {iconNameArray.map(name => (
            <div key={name} className="flex items-center gap-2">
              <span>{name}</span>
              <Icon name={name} className="h-6 w-6" aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      {/* Colors */}

      <div>
        <div className="bg-primary">
          <h2 className="mb-2 text-xl font-semibold text-primary-foreground">Colors</h2>
        </div>

        <ColorSwatches />
      </div>
    </div>
  )
}

const ColorSwatches: React.FC = () => {
  return (
    <div className="grid grid-cols-1 gap-4 bg-gray-500 p-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Border</p>
        <div className="h-20 w-full bg-border"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Input Default</p>
        <div className="h-20 w-full bg-input"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Input Invalid</p>
        <div className="h-20 w-full bg-input-invalid"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Ring Default</p>
        <div className="h-20 w-full bg-ring"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Ring Invalid</p>
        <div className="h-20 w-full bg-ring-invalid"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Background</p>
        <div className="h-20 w-full bg-background"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Foreground Default</p>
        <div className="h-20 w-full bg-foreground"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Foreground Destructive</p>
        <div className="h-20 w-full bg-foreground-destructive"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Primary Default</p>
        <div className="h-20 w-full bg-primary"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Primary Foreground</p>
        <div className="h-20 w-full bg-primary-foreground"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Secondary Default</p>
        <div className="h-20 w-full bg-secondary"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Secondary Foreground</p>
        <div className="h-20 w-full bg-secondary-foreground"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Destructive Default</p>
        <div className="h-20 w-full bg-destructive"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Destructive Foreground</p>
        <div className="h-20 w-full bg-destructive-foreground"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Muted Default</p>
        <div className="h-20 w-full bg-muted"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Muted Foreground</p>
        <div className="h-20 w-full bg-muted-foreground"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Accent Default</p>
        <div className="h-20 w-full bg-accent"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Accent Foreground</p>
        <div className="h-20 w-full bg-accent-foreground"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Popover Default</p>
        <div className="h-20 w-full bg-popover"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Popover Foreground</p>
        <div className="h-20 w-full bg-popover-foreground"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Card Default</p>
        <div className="h-20 w-full bg-card"></div>
      </div>
      <div className="flex flex-col gap-2 p-1">
        <p className="text-foreground">Card Foreground</p>
        <div className="h-20 w-full bg-card-foreground"></div>
      </div>
    </div>
  )
}
