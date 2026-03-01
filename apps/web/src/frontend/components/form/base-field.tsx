import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@repo/ui/field';
import { useStore } from '@tanstack/react-form';
import { memo } from 'react';
import type { FieldApi } from '@tanstack/react-form';
import type { ReactNode } from 'react';

export interface FieldProps<T> {
  label?: string;
  description?: string | ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'responsive';
  descriptionBefore?: boolean;
  field: TypedFieldApi<T>;
  contentClassName?: string;
}

type TypedFieldApi<T> = FieldApi<
  any,
  any,
  T,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any,
  any
>;

type BaseFieldChildren<T> = (props: {
  field: TypedFieldApi<T>;
  isInvalid: boolean;
  isSubmitting: boolean;
}) => ReactNode;

interface BaseFieldProps<T> extends FieldProps<T> {
  children: BaseFieldChildren<T>;
}

function BaseFieldImpl<T>({
  label,
  description,
  descriptionBefore,
  orientation,
  field,
  contentClassName,
  children,
}: BaseFieldProps<T>) {
  const isSubmitting = useStore(
    field.form.store,
    (state) => state.isSubmitting,
  );

  const errors = useStore(field.store, (state) => state.meta.errors);

  const isInvalid = useStore(
    field.store,
    (state) => state.meta.isTouched && !state.meta.isValid,
  );

  const descrElem = description ? (
    typeof description === 'string' ? (
      <FieldDescription>{description}</FieldDescription>
    ) : (
      description
    )
  ) : null;

  const labelElem = label ? (
    <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
  ) : null;

  const errorElem = isInvalid && <FieldError errors={errors} />;

  const childrenElem = children({ field, isInvalid, isSubmitting });

  return (
    <Field data-invalid={isInvalid} orientation={orientation}>
      {descriptionBefore ? (
        <>
          <FieldContent className={contentClassName}>
            {labelElem}
            {descrElem}
          </FieldContent>
          {childrenElem}
          {errorElem}
        </>
      ) : description ? (
        <>
          {labelElem}
          {errorElem}
          {childrenElem}
          {descrElem}
        </>
      ) : (
        <>
          {labelElem}
          {childrenElem}
          {errorElem}
        </>
      )}
    </Field>
  );
}

export const BaseField = memo(BaseFieldImpl) as typeof BaseFieldImpl;
