import { Input } from '@repo/ui/components/input';
import { BaseField } from './base-field';
import type { InputHTMLAttributes, RefObject } from 'react';
import type { FieldProps } from './base-field';

interface InputFieldProps extends FieldProps<string> {
  type: InputHTMLAttributes<HTMLInputElement>['type'];
  placeholder: string;
  max?: number;
  ref?: RefObject<HTMLInputElement | null>;
  autofocus?: boolean;
}

export function InputField({
  type,
  placeholder,
  max,
  ref,
  field,
  required,
  autofocus,
  ...props
}: InputFieldProps) {
  return (
    <BaseField
      field={field}
      {...props}
      required
      children={({ field, isInvalid, isSubmitting }) => (
        <Input
          ref={ref}
          max={max}
          type={type}
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
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
