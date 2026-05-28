import { useAppForm } from '@/hooks/use-form';
import authClient from '@repo/auth/auth-client';
import { Alert, AlertDescription } from '@repo/ui/components/alert';
import { Button } from '@repo/ui/components/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldSeparator,
} from '@repo/ui/components/field';
import { formOptions } from '@tanstack/react-form';
import { Link, useSearch } from '@tanstack/react-router';
import { AlertCircleIcon } from 'lucide-react';
import { useState } from 'react';
import * as z from 'zod';

const majRegex = /[A-Z]/;
const minRegex = /[a-z]/;
const numRegex = /\d/;
const specialRegex = /[^A-Za-z0-9]/;

const schema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .max(30, 'Password must be at most 30 characters long')
    .refine((v) => majRegex.test(v), {
      message: 'Password must contain at least one uppercase letter',
    })
    .refine((v) => minRegex.test(v), {
      message: 'Password must contain at least one lowercase letter',
    })
    .refine((v) => numRegex.test(v), {
      message: 'Password must contain at least one number',
    })
    .refine((v) => specialRegex.test(v), {
      message: 'Password must contain at least one special character',
    }),
});

type LoginFormSchema = z.infer<typeof schema>;

const loginFormOptions = formOptions({
  defaultValues: {
    email: '',
    password: '',
  } satisfies LoginFormSchema,
  validators: {
    onChange: schema,
    onSubmit: schema,
  },
});

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const { redirectUrl } = useSearch({ from: '/_auth/login' });
  const form = useAppForm({
    ...loginFormOptions,
    onSubmit: async ({ value }) => {
      setError(null);
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
          callbackURL: redirectUrl,
        },
        {
          onError: ({ error }) => {
            setError(error.message ?? 'Unkown error occured please try again.');
          },
        },
      );
    },
  });
  return (
    <form
      className="flex flex-col gap-6"
      id="product-form"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Login to your account</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Enter your email below to login to your account
          </p>
          {error && (
            <Alert variant="destructive" className="max-w-md">
              <AlertCircleIcon />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        <form.AppField name="email">
          {(field) => (
            <field.Input
              label="Email"
              placeholder="Example@example.com"
              type="email"
              field={field}
              required
              autofocus
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.Password
              label="Password"
              placeholder="Password"
              field={field}
              contentClassName="flex-row"
              description={
                <div className="flex w-full justify-end">
                  <Link
                    to={'/signup'}
                    search={{ redirectUrl: redirectUrl }}
                    className="hover:underline hover:text-primary text-muted-foreground text-sm"
                  >
                    Forgot your password?
                  </Link>
                </div>
              }
            />
          )}
        </form.AppField>
        <form.AppForm>
          <form.SubmitButton label="Login" />
        </form.AppForm>
        <FieldSeparator>Or continue with</FieldSeparator>
        <Field>
          <Button variant="outline" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Login with Google
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              search={{ redirectUrl: redirectUrl }}
              className="underline underline-offset-4"
            >
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
