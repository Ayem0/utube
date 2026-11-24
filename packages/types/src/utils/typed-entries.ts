type Entry<T> = T extends object
  ? {
      [K in keyof T]: [K, T[K]];
    }[keyof T]
  : never;

export function entries<T extends object>(obj: T): Entry<T>[] {
  return Object.entries(obj) as Entry<T>[];
}

export function fromEntries<K extends PropertyKey, T extends readonly [K, any]>(
  entries: T[],
): Record<T[0], T[1]> {
  return Object.fromEntries(entries) as Record<T[0], T[1]>;
}
