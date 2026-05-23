export function VideoPlayerControls({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute bottom-0 left-0 opacity-0 right-0 transition-opacity duration-200 ease-in-out pointer-events-none group-data-active:pointer-events-auto group-data-active:opacity-100">
      <div className="flex w-full flex-col gap-1 px-3 pb-2">{children}</div>
    </div>
  );
}
