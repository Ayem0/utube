import { Effect } from "effect";

export const timed = <A, E, R>(
  name: string,
  effect: Effect.Effect<A, E, R>,
) => {
  return Effect.gen(function* () {
    const start = performance.now();
    const res = yield* effect;
    console.log(`${name} TIME: `, performance.now() - start);
    return res;
  });
};
