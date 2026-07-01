#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { ApiGatewayLambdaCompressionSampleStack } from "../lib/api-gateway-lambda-compression-sample-stack";

const app = new cdk.App();
new ApiGatewayLambdaCompressionSampleStack(
  app,
  "ApiGatewayLambdaCompressionSampleStack",
  {},
);
