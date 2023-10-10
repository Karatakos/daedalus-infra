#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import DaedalusNetwork from '../lib/network';
import DaedalusCluster from '../lib/cluster';

import DaedalusDb from '../lib/db';

const app = new cdk.App();

const networkStack = new DaedalusNetwork(app, 'DaedalusNetwork', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION}
});

const clusterStack = new DaedalusCluster(app, 'DaedalusCluster', 
  networkStack.vpc,
  {
    env: { 
      account: process.env.CDK_DEFAULT_ACCOUNT, 
      region: process.env.CDK_DEFAULT_REGION}
  }
);

const dbStack = new DaedalusDb(app, 'DaedalusDb', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION}
});