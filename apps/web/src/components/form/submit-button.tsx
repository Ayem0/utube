import { Button } from '@repo/ui/components/button';
import { Spinner } from '@repo/ui/components/spinner';
import { useFormContext } from '@/hooks/use-form';

export function SubmitButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const form = useFormContext();
  return (
    <form.Subscribe
      selector={(state) => ({
        isSubmitting: state.isSubmitting,
        isValid: state.isValid,
      })}
    >
      {({ isSubmitting, isValid }) => (
        <Button
          disabled={isSubmitting || !isValid}
          type="submit"
          className={className}
        >
          {isSubmitting ? <Spinner /> : label}
        </Button>
      )}
    </form.Subscribe>
  );
}
