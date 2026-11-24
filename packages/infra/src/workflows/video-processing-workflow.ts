import { Schema } from "effect";
import { DurableDeferred, Workflow } from "effect/workflow";

export const SchemaTrue = Schema.Literal(true);

export const SchemaFalse = Schema.Literal(false);

export const VideoProcessingResultFailure = Schema.Struct({
  success: SchemaFalse,
  attemptId: Schema.String,
  reason: Schema.String,
  retryable: Schema.Boolean,
});

export type VideoProcessingResultFailure =
  typeof VideoProcessingResultFailure.Type;

export const VideoProcessingResultSuccess = Schema.Struct({
  success: SchemaTrue,
  attemptId: Schema.String,
});

export const VideoProcessingResultSchema = Schema.Union([
  VideoProcessingResultFailure,
  VideoProcessingResultSuccess,
]);

export const VideoProcessingResultDeferred = (attemptId: string) =>
  DurableDeferred.make(`video-processing-result-${attemptId}`, {
    success: VideoProcessingResultSchema,
  });

export const VideoProcessingWorkflow = Workflow.make(
  "VideoProcessingWorkflow",
  {
    payload: {
      workflowKey: Schema.String,
      assetId: Schema.String,
    },
    idempotencyKey: ({ workflowKey }) => workflowKey,
  },
);
