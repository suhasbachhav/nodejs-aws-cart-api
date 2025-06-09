#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();
new CdkStack(app, 'CdkStack', {
  env: {
      account: process.env.AWS_ACCOUNT || '199215057860',
      region: process.env.AWS_REGION || 'ap-south-1',
  },
});
app.synth();
