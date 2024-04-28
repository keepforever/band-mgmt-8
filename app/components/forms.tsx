import { useInputControl } from '@conform-to/react'
import React, { useId } from 'react'
import { cn } from '#app/utils/misc.js'
import { Checkbox, type CheckboxProps } from './ui/checkbox.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { Textarea } from './ui/textarea.tsx'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({ id, errors, className }: { errors?: ListOfErrors; id?: string; className?: string }) {
  const errorsToRender = errors?.filter(Boolean)
  if (!errorsToRender?.length) return null
  return (
    <ul id={id} className={cn('flex flex-col gap-1', className)}>
      {errorsToRender.map(e => (
        <li key={e} className="text-[10px] text-foreground-destructive">
          {e}
        </li>
      ))}
    </ul>
  )
}

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = inputProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Input id={id} aria-invalid={errorId ? true : undefined} aria-describedby={errorId} {...inputProps} />
      <div className="min-h-[32px] px-4 pb-3 pt-1">{errorId ? <ErrorList id={errorId} errors={errors} /> : null}</div>
    </div>
  )
}

export function TextareaField({
  labelProps,
  textareaProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <Label htmlFor={id} {...labelProps} />
      <Textarea id={id} aria-invalid={errorId ? true : undefined} aria-describedby={errorId} {...textareaProps} />
      <div className="min-h-[32px] px-4 pb-3 pt-1">{errorId ? <ErrorList id={errorId} errors={errors} /> : null}</div>
    </div>
  )
}

export function CheckboxField({
  labelProps,
  buttonProps,
  errors,
  className,
}: {
  labelProps: JSX.IntrinsicElements['label']
  buttonProps: CheckboxProps & {
    name: string
    form: string
    value?: string
  }
  errors?: ListOfErrors
  className?: string
}) {
  const { key, defaultChecked, ...checkboxProps } = buttonProps
  const fallbackId = useId()
  const checkedValue = buttonProps.value ?? 'on'
  const input = useInputControl({
    key,
    name: buttonProps.name,
    formId: buttonProps.form,
    initialValue: defaultChecked ? checkedValue : undefined,
  })
  const id = buttonProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined

  return (
    <div className={className}>
      <div className="flex gap-2">
        <Checkbox
          {...checkboxProps}
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          checked={input.value === checkedValue}
          onCheckedChange={state => {
            input.change(state.valueOf() ? checkedValue : '')
            buttonProps.onCheckedChange?.(state)
          }}
          onFocus={event => {
            input.focus()
            buttonProps.onFocus?.(event)
          }}
          onBlur={event => {
            input.blur()
            buttonProps.onBlur?.(event)
          }}
          type="button"
        />
        <label htmlFor={id} {...labelProps} className="self-center text-body-xs text-muted-foreground" />
      </div>
      <div className="px-4 pb-3 pt-1">{errorId ? <ErrorList id={errorId} errors={errors} /> : null}</div>
    </div>
  )
}
export const selectInputClassName = (additionalClasses?: string) =>
  cn(
    'mb-0 flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
    additionalClasses,
  )

type SelectProps<T> = {
  getOptionLabel: (option: T) => string
  getOptionValue: (option: T) => string
  label?: string
  labelHtmlFor?: string
  options: T[]
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement>
  errors?: ListOfErrors
  className?: string
  selectClassName?: string
}

export const SelectField: React.FC<SelectProps<any>> = ({
  getOptionLabel,
  getOptionValue,
  label = '',
  labelHtmlFor,
  options,
  selectProps,
  errors,
  className,
  selectClassName,
}) => {
  const id = selectProps.id
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={className}>
      <Label htmlFor={labelHtmlFor} children={label} className="mt-0" />

      <select {...selectProps} className={selectInputClassName(selectClassName)}>
        {options.map(option => (
          <option key={getOptionValue(option)} value={getOptionValue(option)}>
            {getOptionLabel(option)}
          </option>
        ))}
      </select>

      <div className="min-h-[32px] px-4 pb-3 pt-1">{errorId ? <ErrorList id={errorId} errors={errors} /> : null}</div>
    </div>
  )
}
