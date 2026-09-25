import { Context, Effect, Layer, Redacted } from "effect";
import { Buffer } from "node:buffer";
import { VideoPlaybackError } from "./video-errors";

export interface VideoPlaybackApi {
  createPlaybackToken: (params: {
    videoId: string;
    playbackId: string;
    durationSeconds: number;
  }) => Effect.Effect<{ token: string; exp: number }, VideoPlaybackError>;
  validatePlaybackToken: (params: {
    token: string;
    pathname: string;
  }) => Effect.Effect<boolean, never>;
  refreshToken: (params: {
    oldToken: string;
    videoId: string;
    playbackId: string;
    durationSeconds: number;
  }) => Effect.Effect<{ token: string; exp: number }, VideoPlaybackError>;
}

const encoder = new TextEncoder();
const MAX_TTL = 24 * 60 * 60; // 24 hours in seconds
const importHmacKey = (secret: string) =>
  crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  );

export class VideoPlaybackConfig extends Context.Service<
  VideoPlaybackConfig,
  {
    readonly secret: Redacted.Redacted<string>;
  }
>()("VideoPlaybackConfig") {}

export class VideoPlayback extends Context.Service<
  VideoPlayback,
  VideoPlaybackApi
>()("VideoPlayback", {
  make: Effect.gen(function* () {
    const cfg = yield* VideoPlaybackConfig;
    const createPlaybackToken: VideoPlaybackApi["createPlaybackToken"] = ({
      videoId,
      playbackId,
      durationSeconds,
    }) =>
      Effect.tryPromise({
        try: async () => {
          const key = await importHmacKey(Redacted.value(cfg.secret));
          const data = `/videos/${videoId}/${playbackId}/`;
          const signature = await crypto.subtle.sign(
            "HMAC",
            key,
            encoder.encode(data),
          );
          const token = Buffer.from(signature).toString("base64");
          console.log("DATA,", data, "SIGNATURE", token);

          const now = Math.floor(Date.now() / 1000);
          const deltaAllowed = 15 * 60;
          const exp = Math.floor(now + durationSeconds + deltaAllowed);
          const hmacExp = exp - MAX_TTL;

          console.log("created token", `${hmacExp}.${token}`, exp);
          console.log("SIGNATURE LENGTH:", token.length);

          return { token: `${hmacExp}.${token}`, exp };
        },
        catch: (err) =>
          new VideoPlaybackError({
            cause: err,
            message: "Failed to create playback token",
          }),
      });

    return {
      createPlaybackToken: createPlaybackToken,
      refreshToken: ({ oldToken, videoId, playbackId, durationSeconds }) =>
        Effect.gen(function* () {
          const isValid = yield* Effect.tryPromise({
            try: async (signal) => {
              const key = await importHmacKey(Redacted.value(cfg.secret));
              const [expStr, msg] = oldToken.split(".");
              const now = Math.floor(Date.now() / 1000);
              const exp = Number(expStr);

              if (!Number.isSafeInteger(exp) || !msg) return false;

              if (now > exp + MAX_TTL) {
                return false;
              }

              const data = `/videos/${videoId}/${playbackId}/`;

              const signature = await crypto.subtle.verify(
                "HMAC",
                key,
                Buffer.from(msg, "base64"),
                encoder.encode(data),
              );
              if (!signature) {
                return false;
              }

              return true;
            },
            catch: (err) =>
              new VideoPlaybackError({
                cause: err,
                message: "Failed to refresh token",
              }),
          });

          if (!isValid)
            return yield* new VideoPlaybackError({
              cause: new Error("Invalid token"),
              message: "Token is expired",
            });

          return yield* createPlaybackToken({
            videoId,
            playbackId,
            durationSeconds,
          });
        }),
      validatePlaybackToken: ({ token, pathname }) =>
        Effect.tryPromise({
          try: async () => {
            const key = await importHmacKey(Redacted.value(cfg.secret));
            const [expStr, msg] = token.split(".");
            console.log("RECEIVED TOKEN:", token);
            console.log("MSG:", JSON.stringify(msg));
            console.log("MSG LENGTH:", msg?.length);
            console.log(
              "DECODED LENGTH:",
              msg ? Buffer.from(msg, "base64").length : undefined,
            );

            const now = Math.floor(Date.now() / 1000);
            const exp = Number(expStr);

            if (!Number.isSafeInteger(exp) || !msg) return false;

            if (now > exp + MAX_TTL) {
              console.log("EXPIRED");
              return false; // expired
            }

            const data = pathname.substring(0, 82); // 82 = 0 indexed length (not including last) of "/videos/${videoId}/${playbackId}/" uuids are 36 chars, 8 + 36 + 1 + 36 + 1 = 82
            console.log("data", data);
            const signature = await crypto.subtle.verify(
              "HMAC",
              key,
              Buffer.from(msg, "base64"),
              encoder.encode(data),
            );
            console.log("SIGNATURE VALIDATED", signature);
            return signature;
          },
          catch: (err) => {
            console.log("ERROR: ", err);
          },
        }).pipe(Effect.catch(() => Effect.succeed(false))),
    };
  }),
}) {
  static readonly Layer = Layer.effect(this, this.make);
}
