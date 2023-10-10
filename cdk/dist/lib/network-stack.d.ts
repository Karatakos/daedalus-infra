import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
declare class NetworkStack extends cdk.Stack {
    vpc: ec2.IVpc;
    publicSubnet: ec2.Subnet;
    privateSubnet: ec2.Subnet;
    readonly vpcCidr: string;
    readonly privateSubnetCidr: string;
    readonly publicSubnetCidr: string;
    constructor(scope: Construct, id: string, props?: cdk.StackProps);
}
export default NetworkStack;
