import { Config } from "effect";

export const s3Config = Config.unwrap({
  endpoint: Config.nonEmptyString("AWS_ENDPOINT"),
  forcePathStyle: Config.boolean("AWS_FORCE_PATH_STYLE").pipe(
    Config.withDefault(true),
  ),
  accessKeyId: Config.redacted("AWS_ACCESS_KEY_ID"),
  secretAccessKey: Config.redacted("AWS_SECRET_ACCESS_KEY"),
});
