import { Textarea } from '@repo/ui/textarea';
import { BaseField, FieldProps } from './base-field';

interface TextareaFieldProps extends FieldProps<string> {
  placeholder: string;
  maxLength?: number;
}

export function TextareaField({
  placeholder,
  maxLength,
  field,
  ...props
}: TextareaFieldProps) {
  return (
    <BaseField
      field={field}
      {...props}
      children={({ field, isInvalid, isSubmitting }) => (
        <Textarea
          maxLength={maxLength}
          id={field.name}
          name={field.name}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          placeholder={placeholder}
          autoComplete="off"
          disabled={isSubmitting}
        />
      )}
    />
  );
}
