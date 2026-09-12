import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as budgets from "aws-cdk-lib/aws-budgets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for deployment.`);
  return value;
}

function freePlanEndDate(): Date {
  const value = requiredEnvironment("FREE_PLAN_END_DATE");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(value)) {
    throw new Error("FREE_PLAN_END_DATE must be a UTC ISO-8601 timestamp.");
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("FREE_PLAN_END_DATE must be a UTC ISO-8601 timestamp.");
  }
  if (date.getTime() < Date.now() + 7 * 24 * 60 * 60 * 1000) {
    throw new Error("FREE_PLAN_END_DATE must be at least seven days away.");
  }
  return date;
}

class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const databaseUrl = requiredEnvironment("DATABASE_URL");
    const corsOrigin =
      process.env.FRONTEND_URL?.trim() || requiredEnvironment("CORS_ORIGIN");
    const budgetAlertEmail = requiredEnvironment("BUDGET_ALERT_EMAIL");
    const freePlanEnd = freePlanEndDate();
    const documentBucket = new s3.Bucket(this, "DocumentBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [{ prefix: "incoming/", expiration: cdk.Duration.days(1) }],
      cors: [{
        allowedOrigins: [corsOrigin],
        allowedMethods: [s3.HttpMethods.POST],
        allowedHeaders: ["*"],
      }],
    });

    const environment = {
      DATABASE_URL: databaseUrl,
      CORS_ORIGIN: corsOrigin,
      FREE_PLAN_END_DATE: freePlanEnd.toISOString(),
      S3_BUCKET: documentBucket.bucketName,
      S3_REGION: this.region,
      ...(process.env.HR_EMAIL ? { HR_EMAIL: process.env.HR_EMAIL } : {}),
      ...(process.env.HR_PASSWORD ? { HR_PASSWORD: process.env.HR_PASSWORD } : {}),
      ...(process.env.JWT_SECRET ? { JWT_SECRET: process.env.JWT_SECRET } : {}),
      ...(process.env.JWT_EXPIRES_IN ? { JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN } : {}),
      ...(process.env.APPLICANT_AUTH_SECRET ? { APPLICANT_AUTH_SECRET: process.env.APPLICANT_AUTH_SECRET } : {}),
      ...(process.env.GOOGLE_CLIENT_ID ? { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID } : {}),
      ...(process.env.GOOGLE_CLIENT_SECRET ? { GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET } : {}),
      ...(process.env.GOOGLE_REFRESH_TOKEN ? { GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN } : {}),
      ...(process.env.GOOGLE_SENDER_NAME ? { GOOGLE_SENDER_NAME: process.env.GOOGLE_SENDER_NAME } : {}),
      ...(process.env.GOOGLE_SENDER_EMAIL ? { GOOGLE_SENDER_EMAIL: process.env.GOOGLE_SENDER_EMAIL } : {}),
      ...(process.env.GOOGLE_REPLY_TO_EMAIL ? { GOOGLE_REPLY_TO_EMAIL: process.env.GOOGLE_REPLY_TO_EMAIL } : {}),
      ...(process.env.GOOGLE_SIGNATORY_NAME ? { GOOGLE_SIGNATORY_NAME: process.env.GOOGLE_SIGNATORY_NAME } : {}),
      ...(process.env.MESSENGER_GC_LINK ? { MESSENGER_GC_LINK: process.env.MESSENGER_GC_LINK } : {}),
      ...(process.env.APP_BASE_URL ? { APP_BASE_URL: process.env.APP_BASE_URL } : {}),
      ...(process.env.EMAIL_ENABLED ? { EMAIL_ENABLED: process.env.EMAIL_ENABLED } : {}),
      ...(process.env.RECRUITMENT_YEAR ? { RECRUITMENT_YEAR: process.env.RECRUITMENT_YEAR } : {}),
      ...(process.env.APPLICATION_EDIT_DEADLINE ? { APPLICATION_EDIT_DEADLINE: process.env.APPLICATION_EDIT_DEADLINE } : {}),
    };
    const apiFunction = new NodejsFunction(this, "ApiFunction", {
      entry: path.join(__dirname, "../src/lambda.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),
      reservedConcurrentExecutions: 5,
      logRetention: logs.RetentionDays.ONE_WEEK,
      depsLockFilePath: path.join(__dirname, "../../pnpm-lock.yaml"),
      bundling: { minify: true, sourceMap: true },
      environment,
    });
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
      resources: [documentBucket.arnForObjects("*")],
    }));
    apiFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ["s3:ListBucket"],
      resources: [documentBucket.bucketArn],
    }));

    const cleanupFunction = new NodejsFunction(this, "DocumentCleanupFunction", {
      entry: path.join(__dirname, "../src/cleanup.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(30),
      reservedConcurrentExecutions: 1,
      logRetention: logs.RetentionDays.ONE_WEEK,
      depsLockFilePath: path.join(__dirname, "../../pnpm-lock.yaml"),
      bundling: { minify: true, sourceMap: true },
      environment: { S3_BUCKET: documentBucket.bucketName, S3_REGION: this.region },
    });
    cleanupFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ["s3:DeleteObject"],
      resources: [documentBucket.arnForObjects("*")],
    }));
    cleanupFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ["s3:ListBucket"],
      resources: [documentBucket.bucketArn],
    }));

    const integration = new HttpLambdaIntegration("ApiIntegration", apiFunction);
    const httpApi = new apigateway.HttpApi(this, "HttpApi", {
      defaultIntegration: integration,
      corsPreflight: {
        allowOrigins: [corsOrigin],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.PATCH,
          apigateway.CorsHttpMethod.DELETE,
        ],
        allowHeaders: ["content-type", "authorization"],
      },
    });
    httpApi.addRoutes({ path: "/uploads/presign", methods: [apigateway.HttpMethod.POST], integration });
    const stage = httpApi.defaultStage?.node.defaultChild as apigateway.CfnStage;
    stage.defaultRouteSettings = { throttlingRateLimit: 5, throttlingBurstLimit: 20 };
    stage.routeSettings = {
      "POST /uploads/presign": { ThrottlingRateLimit: 1, ThrottlingBurstLimit: 10 },
    };

    const schedulerRole = new iam.Role(this, "CleanupScheduleRole", {
      assumedBy: new iam.ServicePrincipal("scheduler.amazonaws.com"),
    });
    cleanupFunction.grantInvoke(schedulerRole);
    const cleanupSchedule = new scheduler.CfnSchedule(this, "FreePlanCleanupSchedule", {
      flexibleTimeWindow: { mode: "OFF" },
      scheduleExpression: `at(${freePlanEnd.toISOString().replace(/\.\d{3}Z$/, "")})`,
      scheduleExpressionTimezone: "UTC",
      target: {
        arn: cleanupFunction.functionArn,
        roleArn: schedulerRole.roleArn,
        retryPolicy: { maximumEventAgeInSeconds: 3600, maximumRetryAttempts: 3 },
      },
    });
    cleanupSchedule.addOverride("Properties.ActionAfterCompletion", "DELETE");

    const subscriber = [{ address: budgetAlertEmail, subscriptionType: "EMAIL" }];
    new budgets.CfnBudget(this, "FreePlanBudget", {
      budget: {
        budgetName: "aws-ust-recruitment-free-plan",
        budgetType: "COST",
        timeUnit: "MONTHLY",
        budgetLimit: { amount: 1, unit: "USD" },
      },
      notificationsWithSubscribers: [0.01, 0.5, 1]
        .map((threshold) => ({
          notification: { comparisonOperator: "GREATER_THAN", notificationType: "ACTUAL", threshold, thresholdType: "ABSOLUTE_VALUE" },
          subscribers: subscriber,
        }))
        .concat({
          notification: { comparisonOperator: "GREATER_THAN", notificationType: "FORECASTED", threshold: 0.5, thresholdType: "ABSOLUTE_VALUE" },
          subscribers: subscriber,
        }),
    });

    new cdk.CfnOutput(this, "ApiUrl", { value: httpApi.url! });
    new cdk.CfnOutput(this, "DocumentBucketName", { value: documentBucket.bucketName });
  }
}

const app = new cdk.App();
new BackendStack(app, "AwsUstRecruitmentBackend", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "ap-southeast-1",
  },
});
