import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dotenv from 'dotenv';

dotenv.config();

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cartApiLambda = new nodejs.NodejsFunction(this, 'CartApiLambda', {
      runtime: lambda.Runtime.NODEJS_22_X,
      functionName: 'cartApiLambda',
      handler: 'main.handler',
      code: lambda.Code.fromAsset('../dist'),
      environment: {
        NODE_ENV: 'AWS',
        AUTH_USERNAME: process.env.AUTH_USERNAME as string,
        AUTH_PASSWORD: process.env.AUTH_PASSWORD as string,
        POSTGRES_HOST: process.env.POSTGRES_HOST as string,
        POSTGRES_PORT: process.env.POSTGRES_PORT as string,
        POSTGRES_USER: process.env.POSTGRES_USER as string,
        POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD as string,
        POSTGRES_DATABASE: process.env.POSTGRES_DATABASE as string,
      },
      bundling: {
        externalModules: [
          '@nestjs/microservices',
          '@nestjs/websockets',
          'aws-sdk',
        ],
      },
    });

    const functionUrl = cartApiLambda.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ['*'],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ['*'],
      },
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: functionUrl.url ?? '',
    });
  }
}
