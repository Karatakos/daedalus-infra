import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import * as ecr from 'aws-cdk-lib/aws-ecr';

import { Construct } from 'constructs';

class DaedalusDb extends cdk.Stack {
  private vpc: ec2.IVpc;

  constructor(
    scope: Construct, 
    id: string, 
    props?: cdk.StackProps) {
    super(scope, id, props);

    this.provisionECR();
    this.provisionDynamoAccountsTable();
  }

  private provisionECR() {
    const backendreg = new ecr.Repository(this, "daedalus-backend-repo", {
      autoDeleteImages: true,
      imageScanOnPush: true,
      repositoryName: "daedalus-backend",
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    const gameserverreg = new ecr.Repository(this, "daedalus-dgs-repo", {
      autoDeleteImages: true,
      imageScanOnPush: true,
      repositoryName: "daedalus-dgs",
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });
  }

  private provisionDynamoAccountsTable() {
    const table = new ddb.Table(this, "daedalus-users-table", {
      tableName: "daedalus-users",
      partitionKey: {name: "PK", type: ddb.AttributeType.STRING},
      sortKey: {name: "SK", type: ddb.AttributeType.STRING},
      billingMode: ddb.BillingMode.PROVISIONED,
      readCapacity: 1,
      writeCapacity: 1
    });

    // GSI1 - reverse lookup
    //
    table.addGlobalSecondaryIndex({
      indexName: 'daedalus-users-gsi1',
      partitionKey: {name: "SK", type: ddb.AttributeType.STRING},
      sortKey: {name: "PK", type: ddb.AttributeType.STRING},
      projectionType: ddb.ProjectionType.ALL,
      readCapacity: 1,
      writeCapacity: 1
    })

    cdk.Tags.of(table).add("application", "daedalus");
  }
}

export default DaedalusDb;
