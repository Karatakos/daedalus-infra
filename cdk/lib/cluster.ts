import * as cdk from 'aws-cdk-lib';
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';

class DaedalusCluster extends cdk.Stack {
  private vpc: ec2.IVpc;
  private props?: cdk.StackProps;
 
  constructor(
    scope: Construct, 
    id: string, 
    vpc: ec2.IVpc,
    props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = vpc;
    this.props = props;

    const eksCluster = this.provisionClusterWithCapacity();

    this.provisionClusterAdmin(eksCluster);    
  }

  private provisionClusterWithCapacity() : eks.Cluster {
    const cluster = new eks.Cluster(this, "daedalus-cluster", {
      version: eks.KubernetesVersion.V1_27,
      clusterName: "daedalus-cluster",  
      defaultCapacity: 2,
      // https://cloudonaut.io/versus/docker-containers/ecs-cluster-auto-scaling-vs-eks-managed-node-group/
      //
      defaultCapacityType: eks.DefaultCapacityType.NODEGROUP,
      defaultCapacityInstance: new ec2.InstanceType('t2.nano'),
      vpc: this.vpc,
      vpcSubnets: [{ subnets: this.vpc.privateSubnets }],
      outputClusterName: true,
      outputMastersRoleArn: true,
      placeClusterHandlerInVpc: true
    });

    /*

    TODO: We HAVE to add default capacity when creating the cluster because of a CDK bug.
          Until this is fixed we cannot have control of autoscaling via addNodegroupCapacity

          BUG: If no default capacity is provided, even if we attach capacity via 
               addNodegroupCapacity BEFORE we try to create an ALB controller, the controller
               will fail to install via helm, as it is depenent for some reason on that 
               default capacity being created. It fails, then during the rety fails again
               due to a helm upgrade error (this is the error we see).

               GitHub Issues: https://github.com/aws/aws-cdk/issues/22005  
                              https://github.com/aws/aws-cdk/discussions/19705 

    const eksNodeRole = new iam.Role(this, 'daedalus-cluster-nodegroup-role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly')
      ]
    });

    const nodeGroup = cluster.addNodegroupCapacity("daedalus-cluster-nodegroup", {
      instanceTypes: [
        new ec2.InstanceType('t2.nano')],
      amiType: eks.NodegroupAmiType.AL2_X86_64,
      capacityType: eks.CapacityType.ON_DEMAND,
      desiredSize: 1,
      minSize: 1,
      maxSize: 2,
      nodeRole: eksNodeRole,
      subnets: { subnets: this.vpc.privateSubnets }
    });*/

    // Installation ref: 
    //  k8 version: https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/deploy/installation/ 
    //  aws version (same): https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html 
    //
    const albController = new eks.AlbController(this, "daedalus-cluster-albcontroller", {
      cluster: cluster,
      version: eks.AlbControllerVersion.V2_5_0
    });

    albController.node.addDependency(cluster);

    cdk.Tags.of(cluster).add("application", "daedalus");
    //cdk.Tags.of(nodeGroup).add("application", "daedalus");
    cdk.Tags.of(albController).add("application", "daedalus");

    return cluster
  }

  private provisionClusterAdmin(cluster: eks.Cluster) {
    // New role that only users in our admin group will be able to assume
    //
    const eksAdminRole = new iam.Role(this, "eks-admin-role", {
      // Assumes Admin user group already configured
      //
      roleName: "eks-admin-role",
      assumedBy: new iam.ArnPrincipal(`arn:aws:iam::${this.props?.env?.account}:root`)
    });

    eksAdminRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'eks:AccessKubernetesApi',
        'eks:Describe*',
        'eks:List*'],
      resources: [cluster.clusterArn]
    }));

    // Adds new role to RBAD system:masters group. We can now assume this role
    // to interact with the cluster (admin users)
    //
    cluster.awsAuth.addMastersRole(eksAdminRole)

    const adminGroup = iam.Group.fromGroupName(this, "Admin", "Admin");
    adminGroup.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: [
        'sts:AssumeRole'],
      resources: [eksAdminRole.roleArn],
    }));
  }
}

export default DaedalusCluster;

