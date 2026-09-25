output "video_processing_topic_arn" {
  value = aws_sns_topic.video_processing_job.arn
}

output "video_processing_queue_url" {
  value = aws_sqs_queue.video_processing_job.id
}

output "video_processing_queue_arn" {
  value = aws_sqs_queue.video_processing_job.arn
}

output "video_processing_subscription_arn" {
  value = aws_sns_topic_subscription.video_processing_job_to_queue.arn
}