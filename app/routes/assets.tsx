import { Icon, iconNameArray } from '#app/components/ui/icon.js'
import { cn } from '#app/utils/misc.js'

export default function Assets() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="mb-4 text-3xl font-semibold text-foreground">Assets</h1>

      <Icons />

      <ColorSwatches />

      <TypographySwatches />
    </div>
  )
}

const Icons: React.FC = () => {
  return (
    <div>
      <div className="bg-primary">
        <h2 className="mb-2 text-h2 font-semibold text-primary-foreground">Icons</h2>
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
  )
}

const ColorSwatches: React.FC = () => {
  const colorBlocks = [
    { name: 'Border', color: 'bg-border' },
    { name: 'Input Default', color: 'bg-input' },
    { name: 'Input Invalid', color: 'bg-input-invalid' },
    { name: 'Ring Default', color: 'bg-ring' },
    { name: 'Ring Invalid', color: 'bg-ring-invalid' },
    { name: 'Background', color: 'bg-background' },
    { name: 'Foreground Default', color: 'bg-foreground' },
    { name: 'Foreground Destructive', color: 'bg-foreground-destructive' },
    { name: 'Primary Default', color: 'bg-primary' },
    { name: 'Primary Foreground', color: 'bg-primary-foreground' },
    { name: 'Secondary Default', color: 'bg-secondary' },
    { name: 'Secondary Foreground', color: 'bg-secondary-foreground' },
    { name: 'Destructive Default', color: 'bg-destructive' },
    { name: 'Destructive Foreground', color: 'bg-destructive-foreground' },
    { name: 'Muted Default', color: 'bg-muted' },
    { name: 'Muted Foreground', color: 'bg-muted-foreground' },
    { name: 'Accent Default', color: 'bg-accent' },
    { name: 'Accent Foreground', color: 'bg-accent-foreground' },
    { name: 'Accent Two Default', color: 'bg-accent-two' },
    { name: 'Accent Two Foreground', color: 'bg-accent-two-foreground' },
    { name: 'Hyperlink Default', color: 'bg-hyperlink' },
    { name: 'Hyperlink Hover', color: 'bg-hyperlink-hover' },
    { name: 'Popover Default', color: 'bg-popover' },
    { name: 'Popover Foreground', color: 'bg-popover-foreground' },
    { name: 'Card Default', color: 'bg-card' },
    { name: 'Card Foreground', color: 'bg-card-foreground' },
    { name: 'Status Success', color: 'bg-status-success' },
    { name: 'Status Success Foreground', color: 'bg-status-success-foreground' },
    { name: 'Status Warning', color: 'bg-status-warning' },
    { name: 'Status Warning Foreground', color: 'bg-status-warning-foreground' },
    { name: 'Status Error', color: 'bg-status-error' },
    { name: 'Status Error Foreground', color: 'bg-status-error-foreground' },
    { name: 'Status Info', color: 'bg-status-info' },
    { name: 'Status Info Foreground', color: 'bg-status-info-foreground' },
    { name: 'Status Primary', color: 'bg-status-primary' },
    { name: 'Status Primary Foreground', color: 'bg-status-primary-foreground' },
    { name: 'Status Secondary', color: 'bg-status-secondary' },
    { name: 'Status Secondary Foreground', color: 'bg-status-secondary-foreground' },
  ]

  return (
    <div>
      <div className="bg-primary">
        <h2 className="mb-2 text-h2 font-semibold text-primary-foreground">Colors</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 bg-gray-500 p-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {colorBlocks.map(block => (
          <div key={block.name} className="flex flex-col gap-2 p-1">
            <p className="text-foreground">{block.name}</p>
            <div className={cn(`h-20 w-full`, block.color)}></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Add this new component inside your existing file
const TypographySwatches: React.FC = () => {
  const typographyStyles = [
    { name: 'Mega', className: 'text-mega' },
    { name: 'H1', className: 'text-h1' },
    { name: 'H2', className: 'text-h2' },
    { name: 'H3', className: 'text-h3' },
    { name: 'H4', className: 'text-h4' },
    { name: 'H5', className: 'text-h5' },
    { name: 'H6', className: 'text-h6' },
    { name: 'Body 2XL', className: 'text-body-2xl' },
    { name: 'Body XL', className: 'text-body-xl' },
    { name: 'Body LG', className: 'text-body-lg' },
    { name: 'Body MD', className: 'text-body-md' },
    { name: 'Body SM', className: 'text-body-sm' },
    { name: 'Body XS', className: 'text-body-xs' },
    { name: 'Body 2XS', className: 'text-body-2xs' },
    { name: 'Caption', className: 'text-caption' },
    { name: 'Button', className: 'text-button' },
  ]

  return (
    <div>
      <div className="bg-primary">
        <h2 className="mb-2 text-h2 font-semibold text-primary-foreground">Typography</h2>
      </div>
      <div className="grid grid-cols-1 gap-1 p-2">
        {typographyStyles.map(style => (
          <div key={style.name} className="flex flex-col gap-2 p-1">
            <p className="text-3xl text-accent-two underline">
              {style.name} (<span className="text-2xl text-destructive">{style.className}</span>)
            </p>
            <p className={style.className}>{`The quick brown fox jumps over the lazy dog.`}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
