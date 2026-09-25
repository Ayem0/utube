import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { FileInputField } from '../components/form/file-input-field';
import { PasswordField } from '../components/form/password-field';
import { TextareaField } from '../components/form/textarea-field';
import { SubmitButton } from '@/components/form/submit-button';
import { SelectField } from '@/components/form/select-field';
import { InputField } from '@/components/form/input-field';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup, useTypedAppFormContext } =
  createFormHook({
    fieldComponents: {
      Input: InputField,
      Password: PasswordField,
      Textarea: TextareaField,
      FileInput: FileInputField,
      Select: SelectField,
    },
    formComponents: {
      SubmitButton,
    },
    fieldContext,
    formContext,
  });
