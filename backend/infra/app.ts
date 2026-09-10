import path from "node:path";
import { fileURLToPath } from "node:url";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { HttpApi, CorsHttpMethod } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import type { Construct } from "constructs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        "DATABASE_URL must be set before synthesizing the backend stack",
      );
    }

    const corsOrigin =
      process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ?? "*";

    const fn = new NodejsFunction(this, "ApiFunction", {
      entry: path.join(__dirname, "../src/lambda.ts"),
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_22_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      // pnpm workspaces symlink node_modules; NodejsFunction's auto lockfile
      // detection walks past that, so point it at the root lockfile explicitly.
      depsLockFilePath: path.join(__dirname, "../../pnpm-lock.yaml"),
      bundling: {
        minify: true,
        sourceMap: true,
      },
      environment: {
        DATABASE_URL: databaseUrl,
        CORS_ORIGIN: corsOrigin,
        ...(process.env.HR_EMAIL ? { HR_EMAIL: process.env.HR_EMAIL } : {}),
        ...(process.env.HR_PASSWORD
          ? { HR_PASSWORD: process.env.HR_PASSWORD }
          : {}),
        ...(process.env.JWT_SECRET
          ? { JWT_SECRET: process.env.JWT_SECRET }
          : {}),
        ...(process.env.JWT_EXPIRES_IN
          ? { JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN }
          : {}),
        ...(process.env.APPLICANT_AUTH_SECRET
          ? { APPLICANT_AUTH_SECRET: process.env.APPLICANT_AUTH_SECRET }
          : {}),
        ...(process.env.GOOGLE_CLIENT_ID
          ? { GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID }
          : {}),
        ...(process.env.GOOGLE_CLIENT_SECRET
          ? { GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET }
          : {}),
        ...(process.env.GOOGLE_REFRESH_TOKEN
          ? { GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN }
          : {}),
        ...(process.env.GOOGLE_SENDER_NAME
          ? { GOOGLE_SENDER_NAME: process.env.GOOGLE_SENDER_NAME }
          : {}),
        ...(process.env.GOOGLE_SENDER_EMAIL
          ? { GOOGLE_SENDER_EMAIL: process.env.GOOGLE_SENDER_EMAIL }
          : {}),
        ...(process.env.GOOGLE_REPLY_TO_EMAIL
          ? { GOOGLE_REPLY_TO_EMAIL: process.env.GOOGLE_REPLY_TO_EMAIL }
          : {}),
        ...(process.env.GOOGLE_SIGNATORY_NAME
          ? { GOOGLE_SIGNATORY_NAME: process.env.GOOGLE_SIGNATORY_NAME }
          : {}),
        ...(process.env.MESSENGER_GC_LINK
          ? { MESSENGER_GC_LINK: process.env.MESSENGER_GC_LINK }
          : {}),
        ...(process.env.APP_BASE_URL
          ? { APP_BASE_URL: process.env.APP_BASE_URL }
          : {}),
        ...(process.env.EMAIL_ENABLED
          ? { EMAIL_ENABLED: process.env.EMAIL_ENABLED }
          : {}),
        ...(process.env.RECRUITMENT_YEAR
          ? { RECRUITMENT_YEAR: process.env.RECRUITMENT_YEAR }
          : {}),
        ...(process.env.APPLICATION_EDIT_DEADLINE
          ? { APPLICATION_EDIT_DEADLINE: process.env.APPLICATION_EDIT_DEADLINE }
          : {}),
      },
    });

    const httpApi = new HttpApi(this, "HttpApi", {
      defaultIntegration: new HttpLambdaIntegration("DefaultIntegration", fn),
      corsPreflight: {
        allowOrigins: [corsOrigin],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowHeaders: ["content-type", "authorization"],
      },
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: httpApi.url!,
    });
  }
}

const app = new cdk.App();
new BackendStack(app, "AwsUstRecruitmentBackend", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "ap-southeast-1",
  },
});
