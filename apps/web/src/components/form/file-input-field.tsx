import { Input } from '@repo/ui/components/input';
import type { RefObject } from 'react';
import type { FieldProps } from './base-field';
import { BaseField } from './base-field';

interface FileInputFieldProps extends FieldProps<File | undefined> {
  placeholder?: string;
  ref?: RefObject<HTMLInputElement | null>;
  required?: boolean;
  autofocus?: boolean;
  className?: string;
}

export function FileInputField({
  placeholder,
  ref,
  field,
  required,
  autofocus,
  className,
  ...props
}: FileInputFieldProps) {
  return (
    <BaseField
      field={field}
      {...props}
      required
      children={({ field, isInvalid, isSubmitting }) => (
        <Input
          ref={ref}
          type="file"
          id={field.name}
          name={field.name}
          value={undefined}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.files?.[0] ?? undefined)}
          aria-invalid={isInvalid}
          placeholder={placeholder}
          autoComplete="off"
          disabled={isSubmitting}
          required={required}
          autoFocus={autofocus}
          className={className}
        />
      )}
    />
  );
}
