import { Context, Layer } from "effect";

export interface SQSConfigService {
  readonly videoProcessingQueueUrl: string;
}

const defaultSQSConfigService: SQSConfigService = {
  videoProcessingQueueUrl: process.env.VIDEO_PROCESSING_QUEUE_URL!,
};

export class SQSConfig extends Context.Service<SQSConfig, SQSConfigService>()(
  "SQSConfig",
) {
  static Layer = Layer.succeed(this, defaultSQSConfigService);
}
