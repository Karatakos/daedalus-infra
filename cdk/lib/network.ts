import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { Construct } from 'constructs';

class DaedalusNetwork extends cdk.Stack {
    vpc: ec2.IVpc;
    publicSubnet: ec2.ISubnet;
    privateSubnet: ec2.ISubnet;
    
    readonly vpcCidr: string = '10.0.0.0/16';
    readonly privateSubnetCidrMask: number = 24;
    readonly publicSubnetCidrMask: number = 24;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
        
        this.vpc = new ec2.Vpc(this, "daedalus-vpc", {
            ipAddresses: ec2.IpAddresses.cidr(this.vpcCidr),
            maxAzs: 2,
            subnetConfiguration: [
                {
                    name: 'daedalus-privatesubnet',
                    subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidrMask: this.privateSubnetCidrMask
                },
                {
                    name: 'daedalus-publicsubnet',
                    subnetType: ec2.SubnetType.PUBLIC,
                    cidrMask: this.publicSubnetCidrMask,
                    mapPublicIpOnLaunch: true
                }
            ]
        });

        this.privateSubnet = this.vpc.selectSubnets({subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS}).subnets[0];
        this.publicSubnet = this.vpc.selectSubnets({subnetType: ec2.SubnetType.PUBLIC}).subnets[0];

        cdk.Tags.of(this.vpc).add("application", "daedalus");

        cdk.Tags.of(this.privateSubnet).add("application", "daedalus");
        cdk.Tags.of(this.privateSubnet).add("kubernetes.io/role/elb", "1");

        cdk.Tags.of(this.publicSubnet).add("application", "daedalus");
        cdk.Tags.of(this.privateSubnet).add("kubernetes.io/role/internal-elb", "1");
    }
}

export default DaedalusNetwork;