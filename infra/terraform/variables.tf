variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "video_processing_topic_name" {
  type    = string
  default = "video-processing-job"
}

variable "video_processing_queue_name" {
  type    = string
  default = "video-processing-job-queue"
}