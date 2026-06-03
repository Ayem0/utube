terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  endpoints {
    sns = "http://localstack:4566"
    sqs = "http://localstack:4566"
  }
}

resource "aws_sns_topic" "video_processing_job" {
  name = var.video_processing_topic_name
}

resource "aws_sqs_queue" "video_processing_job" {
  name                       = var.video_processing_queue_name
  visibility_timeout_seconds = 60
  receive_wait_time_seconds  = 20
}

data "aws_iam_policy_document" "video_processing_queue_policy" {
  statement {
    sid    = "AllowSnsToSendMessages"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["sns.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      aws_sqs_queue.video_processing_job.arn
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_sns_topic.video_processing_job.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "video_processing_job" {
  queue_url = aws_sqs_queue.video_processing_job.id
  policy    = data.aws_iam_policy_document.video_processing_queue_policy.json
}

resource "aws_sns_topic_subscription" "video_processing_job_to_queue" {
  topic_arn            = aws_sns_topic.video_processing_job.arn
  protocol             = "sqs"
  endpoint             = aws_sqs_queue.video_processing_job.arn
  raw_message_delivery = true

  depends_on = [
    aws_sqs_queue_policy.video_processing_job
  ]
}