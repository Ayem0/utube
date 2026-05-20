import { Features } from "../feature/feature";
import { Player } from "./player";

// export function createPlayer<T extends Features>(options: {
//   features: T
// }
// ): Player<WithDefaults<T>>;

// export function createPlayer<T extends Features>(options: {}
//   features: T,
//   raw: false,
// ): Player<WithDefaults<T>>;

// export function createPlayer<T extends Features>(
//   features: T,
//   raw: true,
// ): Player<T>;

// export function createPlayer<T extends Features>(
//   features: T,
//   raw = false,
// ): Player<T> | Player<WithDefaults<T>> {
//   if (raw) {
//     return new Player<T>(features, { quality: -1 });
//   }

//   return new Player<WithDefaults<T>>(
//     [playbackFeature, displayFeature, volumeFeature, ...features],
//     {
//       quality: -1,
//     },
//   );
// }

export function createPlayer<T extends Features>(options: {
  features: T;
  defaultQuality?: number;
}): Player<T> {
  return new Player<T>(options.features, {
    quality: options.defaultQuality ?? -1,
  });
}
