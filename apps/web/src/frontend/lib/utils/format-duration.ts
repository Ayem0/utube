/**
 * Format a duration in seconds to a string in the format h:MM:SS or MM:SS.
 * @param d The duration in seconds.
 * @returns The formatted duration.
 */
export function formatDuration(d: number): string {
  const totalSeconds = Math.floor(d);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return hours > 0 ? `${hours}:${mm}:${ss}` : `${mm}:${ss}`;
}
