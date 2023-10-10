import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
declare class BackendClusterStack extends cdk.Stack {
    private vpc;
    private privateSubnet;
    private publicSubnet;
    private props?;
    constructor(scope: Construct, id: string, vpc: ec2.IVpc, privateSubnet: ec2.ISubnet, publicSubnet: ec2.ISubnet, props?: cdk.StackProps);
    private provisionASG;
    private provisionDynamoAccountsTable;
}
export default BackendClusterStack;
