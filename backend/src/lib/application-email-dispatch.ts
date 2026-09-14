import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

const workerFunctionName = process.env.APPLICATION_EMAIL_WORKER_FUNCTION_NAME;
const lambdaClient = workerFunctionName ? new LambdaClient({}) : null;

export async function dispatchApplicationSubmissionEmail(
  applicationId: string,
): Promise<boolean> {
  if (!workerFunctionName || !lambdaClient) return false;

  const result = await lambdaClient.send(
    new InvokeCommand({
      FunctionName: workerFunctionName,
      InvocationType: "Event",
      Payload: JSON.stringify({ applicationId }),
    }),
  );

  if (result.StatusCode !== 202) {
    throw new Error("Could not queue the application email.");
  }

  return true;
}