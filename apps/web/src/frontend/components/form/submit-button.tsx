import { useFormContext } from '@/frontend/hooks/use-form';
import { Button } from '@repo/ui/button';
import { Spinner } from '@repo/ui/spinner';

export function SubmitButton({ label }: { label: string }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? <Spinner /> : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
