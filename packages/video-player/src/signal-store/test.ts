// import { createStore } from "./store";

// type Test = {
//   playback: {
//     paused: boolean;
//     rate: number;
//     ended: boolean;
//   };
//   volume: {
//     volume: number;
//     muted: boolean;
//   };
//   test: boolean;
// };

// export const store = createStore<Test>({
//   playback: {
//     paused: false,
//     rate: 1,
//     ended: false,
//   },
//   volume: {
//     volume: 1,
//     muted: false,
//   },
//   test: false,
// });

// store.subscribe(
//   (s) => s.test,
//   () => {
//     console.log(
//       "playback changed",
//       store.getSnapshot((s) => s.test),
//     );
//   },
// );

// let count = 0;

// while (count < 100) {
//   count++;
//   if (count % 2 === 0) {
//     store.value.test(true);
//   } else {
//     store.value.test(false);
//   }
// }
import { performance } from "node:perf_hooks";
import { createStore } from "./store";

type Test = {
  playback: {
    paused: boolean;
    rate: number;
    ended: boolean;
  };
  volume: {
    volume: number;
    muted: boolean;
  };
};

function bench(name: string, iterations: number, fn: () => void) {
  // warmup
  for (let i = 0; i < 10_000; i++) {
    fn();
  }

  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    fn();
  }

  const end = performance.now();
  const durationMs = end - start;
  const opsPerSecond = (iterations / durationMs) * 1000;

  console.log(
    `${name}: ${durationMs.toFixed(2)}ms | ${opsPerSecond.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, "_")} ops/sec`,
  );
}

function createTestStore() {
  return createStore<Test>({
    playback: {
      paused: false,
      rate: 1,
      ended: false,
    },
    volume: {
      volume: 1,
      muted: false,
    },
  });
}

const ITERATIONS = 1_000_000;

{
  const store = createTestStore();

  bench("leaf read", ITERATIONS, () => {
    store.value.playback.paused();
  });
}

{
  const store = createTestStore();
  let value = false;

  bench("leaf write no subscriber", ITERATIONS, () => {
    value = !value;
    store.value.playback.paused(value);
  });
}

{
  const store = createTestStore();

  bench("branch read", ITERATIONS, () => {
    store.value.playback();
  });
}

{
  const store = createTestStore();
  let value = false;
  let notifications = 0;

  const res = store.subscribe(
    (s) => s.playback.paused,
    () => {
      notifications++;
    },
  );

  bench("leaf write with leaf subscriber", ITERATIONS, () => {
    value = !value;
    store.value.playback.paused(value);
  });

  console.log("notifications:", notifications);
}

{
  const store = createTestStore();
  let value = false;
  let notifications = 0;

  store.subscribe(
    (s) => s.playback,
    () => {
      notifications++;
    },
  );

  bench("leaf write with branch subscriber", ITERATIONS, () => {
    value = !value;
    store.value.playback.paused(value);
  });

  console.log("notifications:", notifications);
}

{
  const store = createTestStore();
  let value = false;
  let notifications = 0;

  store.subscribe(
    (s) => s.playback.paused,
    () => {
      notifications++;
    },
  );

  bench("unrelated leaf write with leaf subscriber", ITERATIONS, () => {
    value = !value;
    store.value.playback.ended(value);
  });

  console.log("notifications:", notifications);
}
