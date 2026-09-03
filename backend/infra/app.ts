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
        ...(process.env.DATABASE_URL
          ? { DATABASE_URL: process.env.DATABASE_URL }
          : {}),
        CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
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
      },
    });

    const httpApi = new HttpApi(this, "HttpApi", {
      defaultIntegration: new HttpLambdaIntegration(
        "DefaultIntegration",
        fn
      ),
      corsPreflight: {
        allowOrigins: [process.env.CORS_ORIGIN ?? "*"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
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
