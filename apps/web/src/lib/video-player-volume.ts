const SESSION_VOLUME_KEY = 'video-player-volume';

export interface VideoPlayerVolumeState {
  volume: number;
  muted: boolean;
}

export function getSessionVolumeState() {
  const stored = sessionStorage.getItem(SESSION_VOLUME_KEY);

  if (stored) {
    try {
      const parsed: VideoPlayerVolumeState = JSON.parse(stored);
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'volume' in parsed &&
        typeof parsed.volume === 'number' &&
        !Number.isNaN(parsed.volume) &&
        'muted' in parsed &&
        typeof parsed.muted === 'boolean'
      ) {
        return parsed;
      }
    } catch (error) {
      console.error(error);
    }
  }

  return { volume: 1, muted: false };
}

export function setSessionVolumeState(state: VideoPlayerVolumeState) {
  sessionStorage.setItem(SESSION_VOLUME_KEY, JSON.stringify(state));
}
