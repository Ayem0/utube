import * as Cloudflare from "@alchemy.run/cloudflare";
import * as Workflows from "alchemy/Workflows";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { Activity, Workflow } from "effect/workflow";

export const Receipts = Cloudflare.R2.Bucket("Receipts");

export const Checkout = Workflow.make("Checkout", {
  payload: { orderId: Schema.String },
  idempotencyKey: ({ orderId }) => orderId,
});

export const CheckoutLive = Workflows.layer(
  Checkout,
  Effect.gen(function* () {
    const receipts = yield* Cloudflare.R2.WriteBucket(Receipts);
    return Effect.fn(function* ({ orderId }) {
      yield* Activity.make({
        name: "receipt",
        execute: receipts
          .put(`${orderId}.json`, JSON.stringify({ orderId }))
          .pipe(Effect.orDie),
      });
    });
  }),
);
