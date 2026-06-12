import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { aws_apigateway as apigateway } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'CartServiceVpc', {
      maxAzs: 2,
    });

    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description: 'Security group for RDS PostgreSQL database',
        allowAllOutbound: false,
      },
    );

    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda function',
        allowAllOutbound: true,
      },
    );

    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to PostgreSQL',
    );

    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    const database = new rds.DatabaseInstance(this, 'PostgreSQLDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: 'cart-service-db-credentials',
      }),
      databaseName: 'cartdb',
      allocatedStorage: 20,
      multiAz: false,
      deleteAutomatedBackups: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const lambdaFunction = new NodejsFunction(this, 'NestjsLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../..', 'dist', 'main.js'),
      projectRoot: path.join(__dirname, '../..'),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      securityGroups: [lambdaSecurityGroup],
      environment: {
        DB_HOST: database.instanceEndpoint.hostname,
        DB_PORT: database.instanceEndpoint.port.toString(),
        DB_NAME: 'cartdb',
        DB_SECRET_ARN: database.secret?.secretArn || '',
      },
      bundling: {
        externalModules: [
          '@nestjs/microservices',
          '@nestjs/websockets',
          'cache-manager',
          'class-transformer',
          'class-validator',
        ],
      },
    });

    // Grant Lambda permission to read database credentials from Secrets Manager
    database.secret?.grantRead(lambdaFunction);

    const api = new apigateway.RestApi(this, 'NestApi', {
      restApiName: 'Nest Service',
      description: 'This service serves a Nest.js application.',
      deploy: true,
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);

    api.root.addProxy({
      defaultIntegration: lambdaIntegration,
      anyMethod: true,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL database endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret?.secretArn || 'No secret created',
      description: 'ARN of the database credentials secret',
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });
  }
}
