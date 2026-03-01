export function xToTime(x: number, width: number, duration: number): number {
  return (x / width) * duration;
}

export function timeToX(ct: number, width: number, duration: number): number {
  return (ct / duration) * width;
}

/**
 * Format seconds to mm:SS or hh:mm:SS
 * @param ct current time in seconds
 * @returns formatted time string
 */
export function formatCt(ct: number) {
  const hours = Math.floor(ct / 3600);
  const minutes = Math.floor((ct % 3600) / 60);
  const seconds = Math.floor(ct % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
