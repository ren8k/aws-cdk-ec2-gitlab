#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AwsCdkEc2GitlabStack } from '../lib/aws-cdk-ec2-gitlab-stack';

const app = new cdk.App();
new AwsCdkEc2GitlabStack(app, 'AwsCdkEc2GitlabStack');
