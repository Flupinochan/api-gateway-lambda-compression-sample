import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as path from "path";

export class ApiGatewayLambdaCompressionSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Lambda ────────────────────────────────────────────────────────────
    const lambdaLogGroup = new logs.LogGroup(this, "LambdaLogGroup", {
      logGroupName: "/aws/lambda/compression-test",
      retention: logs.RetentionDays.ONE_DAY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const compressionFn = new lambda.Function(this, "CompressionTestFunction", {
      functionName: "compression-test",
      runtime: lambda.Runtime.PYTHON_3_14,
      handler: "handler.lambda_handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "../lambda")),
      logGroup: lambdaLogGroup,
    });

    // ── API Gateway REST API ──────────────────────────────────────────────
    const apiGwCloudWatchRole = new iam.Role(this, "ApiGatewayCloudWatchRole", {
      assumedBy: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonAPIGatewayPushToCloudWatchLogs",
        ),
      ],
    });

    const cfnAccount = new apigateway.CfnAccount(this, "ApiGatewayAccount", {
      cloudWatchRoleArn: apiGwCloudWatchRole.roleArn,
    });

    const apiGwAccessLogGroup = new logs.LogGroup(
      this,
      "ApiGatewayAccessLogGroup",
      {
        logGroupName: "/aws/api-gateway/compression-test/access",
        retention: logs.RetentionDays.ONE_DAY,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      },
    );

    const api = new apigateway.RestApi(this, "CompressionTestApi", {
      restApiName: "compression-test-api",
      // Lambda の response body は文字列のみ返却可能なため、バイナリは base64 エンコードして返却する必要がある
      // API Gateway はリクエストの Accept ヘッダーが binaryMediaTypes にマッチし、かつ isBase64Encoded: true のときに
      // response body を base64 デコードしてバイナリとしてクライアントへ返却する
      // */* により Accept ヘッダーの値を問わず常にマッチさせているが適切に設定しても良い
      // binaryMediaTypes はリクエスト/レスポンス両方に適用される
      binaryMediaTypes: ["*/*"],
      deployOptions: {
        stageName: "dev",
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiGwAccessLogGroup,
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
    });

    api.node.addDependency(cfnAccount);
    const lambdaIntegration = new apigateway.LambdaIntegration(compressionFn);
    api.root.addResource("text").addMethod("GET", lambdaIntegration);
    api.root.addResource("binary").addMethod("GET", lambdaIntegration);
  }
}
