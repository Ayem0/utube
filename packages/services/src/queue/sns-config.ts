import { Context, Layer } from "effect";

export interface SNSConfigService {
  readonly videoProcessingTopicArn: string;
  readonly imageProcessingTopicArn: string;
}

const defaultSnsConfigService: SNSConfigService = {
  videoProcessingTopicArn: process.env.VIDEO_PROCESSING_TOPIC_ARN!,
  imageProcessingTopicArn: process.env.IMAGE_PROCESSING_TOPIC_ARN ?? "",
};

export class SNSConfig extends Context.Service<SNSConfig, SNSConfigService>()(
  "SNSConfig",
) {
  static Layer = Layer.succeed(this, defaultSnsConfigService);
}
