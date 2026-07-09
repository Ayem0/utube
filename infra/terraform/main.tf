terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }

    null = {
      source  = "hashicorp/null"
      version = ">= 3.2"
    }

    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.4"
    }
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = "test"
  secret_key = "test"

  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true

  s3_use_path_style = true

  endpoints {
    sns    = "http://localstack:4566"
    sqs    = "http://localstack:4566"
    s3     = "http://localstack:4566"
    lambda = "http://localstack:4566"
    iam    = "http://localstack:4566"
    sts    = "http://localstack:4566"
    logs   = "http://localstack:4566"
  }
}

# -------------------------------------------------------------------
# Existing video-processing SNS -> SQS
# -------------------------------------------------------------------

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

# -------------------------------------------------------------------
# Assets S3 -> SQS -> ZIP Lambda
# -------------------------------------------------------------------

locals {
  repo_root = abspath("${path.module}/../..")

  assets_bucket_name       = "assets"
  videos_bucket_name = "videos"
  assets_bucket_queue_name = "assets-bucket-queue"

  lambda_name    = "assets-bucket-events-consumer-lambda"
  lambda_app_dir = "${local.repo_root}/apps/assets-bucket-events-consumer-lambda"

  lambda_dist_dir = "${local.lambda_app_dir}/dist"
  lambda_zip_path = "${local.lambda_dist_dir}/${local.lambda_name}.zip"
}

# -------------------------------------------------------------------
# S3 bucket
# -------------------------------------------------------------------

resource "aws_s3_bucket" "assets" {
  bucket = local.assets_bucket_name
}
resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    id = "allow-local-frontend-upload"

    allowed_methods = [
      "PUT",
    ]

    allowed_origins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ]

    allowed_headers = ["*"]

    expose_headers = [
      "ETag",
    ]

    max_age_seconds = 3600
  }
}

resource "aws_s3_bucket" "videos" {
  bucket = local.videos_bucket_name
}
resource "aws_s3_bucket_cors_configuration" "videos" {
  bucket = aws_s3_bucket.videos.id

  cors_rule {
    id = "allow-local-frontend-read"

    allowed_methods = [
      "GET"
    ]

    allowed_origins = [
      "http://localhost:3000"
    ]

    allowed_headers = ["*"]

    expose_headers = [
      "ETag",
    ]

    max_age_seconds = 3600
  }
}


# -------------------------------------------------------------------
# SQS queue receiving S3 events
# -------------------------------------------------------------------

resource "aws_sqs_queue" "assets_bucket_events" {
  name                       = local.assets_bucket_queue_name
  visibility_timeout_seconds = 60
  receive_wait_time_seconds  = 20
}

data "aws_iam_policy_document" "assets_bucket_queue_policy" {
  statement {
    sid    = "AllowS3ToSendObjectCreatedEvents"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["s3.amazonaws.com"]
    }

    actions = [
      "sqs:SendMessage"
    ]

    resources = [
      aws_sqs_queue.assets_bucket_events.arn
    ]

    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = [aws_s3_bucket.assets.arn]
    }
  }
}

resource "aws_sqs_queue_policy" "assets_bucket_events" {
  queue_url = aws_sqs_queue.assets_bucket_events.id
  policy    = data.aws_iam_policy_document.assets_bucket_queue_policy.json
}

resource "aws_s3_bucket_notification" "assets_object_created" {
  bucket = aws_s3_bucket.assets.id

  queue {
    id        = "assets-object-created-to-sqs"
    queue_arn = aws_sqs_queue.assets_bucket_events.arn
    events    = ["s3:ObjectCreated:*"]
  }

  depends_on = [
    aws_sqs_queue_policy.assets_bucket_events
  ]
}

# -------------------------------------------------------------------
# Build and package Lambda ZIP
# -------------------------------------------------------------------


data "archive_file" "assets_bucket_events_consumer_lambda" {
  type        = "zip"
  source_dir  = local.lambda_dist_dir
  output_path = local.lambda_zip_path
}

# -------------------------------------------------------------------
# Lambda IAM role
# -------------------------------------------------------------------

resource "aws_iam_role" "assets_bucket_events_consumer_lambda" {
  name = "${local.lambda_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

resource "aws_iam_role_policy" "assets_bucket_events_consumer_lambda" {
  name = "${local.lambda_name}-policy"
  role = aws_iam_role.assets_bucket_events_consumer_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowLambdaLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Sid    = "AllowLambdaToConsumeAssetsBucketQueue"
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = aws_sqs_queue.assets_bucket_events.arn
      }
    ]
  })
}

# -------------------------------------------------------------------
# ZIP Lambda function
# -------------------------------------------------------------------

resource "aws_lambda_function" "assets_bucket_events_consumer" {
  function_name = local.lambda_name

  role    = aws_iam_role.assets_bucket_events_consumer_lambda.arn
  runtime = "nodejs22.x"
  handler = "index.handler"

  filename         = data.archive_file.assets_bucket_events_consumer_lambda.output_path
  source_code_hash = data.archive_file.assets_bucket_events_consumer_lambda.output_base64sha256

  architectures = ["x86_64"]

  timeout     = 30
  memory_size = 256

  environment {
    variables = {
      NODE_ENV                   = "development"
      DATABASE_URL               = "postgresql://root:root@db:5432/mydb"
      AWS_REGION                 = var.aws_region
      AWS_ENDPOINT               = "http://localstack:4566"
      AWS_ACCESS_KEY_ID          = "test"
      AWS_SECRET_ACCESS_KEY      = "test"
      VIDEO_PROCESSING_TOPIC_ARN = aws_sns_topic.video_processing_job.arn
    }
  }

  depends_on = [
    aws_iam_role_policy.assets_bucket_events_consumer_lambda
  ]
}

# -------------------------------------------------------------------
# SQS -> Lambda trigger
# -------------------------------------------------------------------

resource "aws_lambda_event_source_mapping" "assets_bucket_queue_to_lambda" {
  event_source_arn = aws_sqs_queue.assets_bucket_events.arn
  function_name    = aws_lambda_function.assets_bucket_events_consumer.arn

  batch_size = 10
  enabled    = true

  depends_on = [
    aws_iam_role_policy.assets_bucket_events_consumer_lambda
  ]
}