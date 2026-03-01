import { InputField } from '@/frontend/components/form/input-field';
import { SubmitButton } from '@/frontend/components/form/submit-button';
import { createFormHook, createFormHookContexts } from '@tanstack/react-form';
import { FileInputField } from '../components/form/file-input-field';
import { PasswordField } from '../components/form/password-field';
import { TextareaField } from '../components/form/textarea-field';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: {
    Input: InputField,
    Password: PasswordField,
    Textarea: TextareaField,
    FileInput: FileInputField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
