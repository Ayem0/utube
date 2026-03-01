import { BaseField, FieldProps } from '@/frontend/components/form/base-field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@repo/ui/input-group';
import { Eye, EyeOff } from 'lucide-react';
import { RefObject, useState } from 'react';

interface InputFieldProps extends FieldProps<string> {
  placeholder: string;
  max?: number;
  ref?: RefObject<HTMLInputElement | null>;
}

export function PasswordField({
  placeholder,
  max,
  ref,
  field,
  ...props
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <BaseField
      field={field}
      {...props}
      children={({ field, isInvalid, isSubmitting }) => (
        <InputGroup>
          <InputGroupInput
            ref={ref}
            max={max}
            type={showPassword ? 'text' : 'password'}
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            aria-invalid={isInvalid}
            placeholder={placeholder}
            autoComplete="off"
            disabled={isSubmitting}
            required
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      )}
    />
  );
}
