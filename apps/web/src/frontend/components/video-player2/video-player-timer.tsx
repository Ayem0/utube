export function VideoPlayerTimer({
  timerElRef,
  durationElRef,
}: {
  timerElRef: React.RefObject<HTMLSpanElement | null>;
  durationElRef: React.RefObject<HTMLSpanElement | null>;
}) {
  return (
    <div className="text-white text-sm text-nowrap leading-none rounded-full hover:bg-muted dark:hover:bg-muted/50 px-2 flex items-center ">
      <span ref={timerElRef}></span>
      <span className="px-1">/</span>
      <span ref={durationElRef}></span>
    </div>
  );
}
