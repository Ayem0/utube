import { useFormContext } from '@/hooks/use-form';
import { Button } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';

export function SubmitButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button disabled={isSubmitting} type="submit" className={className}>
          {isSubmitting ? <Spinner /> : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
