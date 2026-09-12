#!/bin/sh
set -eu

awslocal s3api create-bucket --bucket "$S3_BUCKET" 2>/dev/null || true
awslocal s3api put-public-access-block --bucket "$S3_BUCKET" --public-access-block-configuration 'BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true'
awslocal s3api put-bucket-encryption --bucket "$S3_BUCKET" --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
awslocal s3api put-bucket-cors --bucket "$S3_BUCKET" --cors-configuration "{\"CORSRules\":[{\"AllowedHeaders\":[\"*\"],\"AllowedMethods\":[\"POST\"],\"AllowedOrigins\":[\"$CORS_ORIGIN\"],\"ExposeHeaders\":[\"ETag\"],\"MaxAgeSeconds\":300}]}"
awslocal s3api put-bucket-lifecycle-configuration --bucket "$S3_BUCKET" --lifecycle-configuration '{"Rules":[{"ID":"expire-incoming-after-one-day","Filter":{"Prefix":"incoming/"},"Status":"Enabled","Expiration":{"Days":1}}]}'
