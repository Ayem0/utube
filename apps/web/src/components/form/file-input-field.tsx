import { Input } from '@repo/ui/components/input';
import type { RefObject } from 'react';
import type { FieldProps } from './base-field';
import { BaseField } from './base-field';

interface FileInputFieldProps extends FieldProps<File | undefined> {
  placeholder: string;
  max?: number;
  ref?: RefObject<HTMLInputElement | null>;
  required?: boolean;
  autofocus?: boolean;
}

export function FileInputField({
  placeholder,
  max,
  ref,
  field,
  required,
  autofocus,
  ...props
}: FileInputFieldProps) {
  return (
    <BaseField
      field={field}
      {...props}
      children={({ field, isInvalid, isSubmitting }) => (
        <Input
          ref={ref}
          max={max}
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
        />
      )}
    />
  );
}
