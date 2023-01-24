import { Context, APIGatewayProxyResult, APIGatewayEvent } from 'aws-lambda';

export async function ping(
  event: APIGatewayEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log({ context });
  return {
    statusCode: 200,
    body: JSON.stringify({ event, context }),
  };
}
