import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/components/select';
import { BaseField } from './base-field';
import type { FieldProps } from './base-field';

interface SelectFieldProps<
  TValue,
  TMultiple extends boolean = false,
> extends FieldProps<TMultiple extends true ? Array<TValue> : TValue> {
  placeholder: string;
  autofocus?: boolean;
  defaultValue?: TMultiple extends true ? Array<TValue> : TValue;
  items: Array<{ label: string; value: TValue }>;
}

export function SelectField<TValue, TMultiple extends boolean = false>({
  placeholder,
  field,
  required,
  autofocus,
  defaultValue,
  items,
  ...props
}: SelectFieldProps<TValue, TMultiple>) {
  return (
    <BaseField
      field={field}
      {...props}
      required
      children={({ field, isInvalid, isSubmitting }) => (
        <Select<TValue, TMultiple>
          items={items}
          disabled={isSubmitting}
          defaultValue={defaultValue}
          required={required}
          onValueChange={(v) => {
            if (v === null) return;
            field.handleChange(v);
          }}
        >
          <SelectTrigger className="w-[180px]" aria-invalid={isInvalid}>
            <SelectValue placeholder={placeholder} autoFocus={autofocus} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {items.map((item) => (
                <SelectItem key={item.label} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    />
  );
}
