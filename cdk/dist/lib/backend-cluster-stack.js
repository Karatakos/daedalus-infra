"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require("aws-cdk-lib");
const eks = require("aws-cdk-lib/aws-eks");
const ec2 = require("aws-cdk-lib/aws-ec2");
const ddb = require("aws-cdk-lib/aws-dynamodb");
const iam = require("aws-cdk-lib/aws-iam");
const asg = require("aws-cdk-lib/aws-autoscaling");
class BackendClusterStack extends cdk.Stack {
    constructor(scope, id, vpc, privateSubnet, publicSubnet, props) {
        super(scope, id, props);
        this.vpc = vpc;
        this.privateSubnet = privateSubnet;
        this.publicSubnet = publicSubnet;
        this.props = props;
        const cluster = new eks.Cluster(scope, "dungen-backend-cluster", {
            version: eks.KubernetesVersion.V1_23,
            // Adding our own capacity for full control
            //
            defaultCapacity: 0,
            vpc: vpc,
            // CDK now takes care of the controller installation for us. 
            // Q: Which subnet??? 
            //
            // Installation ref: 
            //  k8 version: https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/deploy/installation/ 
            //  aws version (same): https://docs.aws.amazon.com/eks/latest/userguide/aws-load-balancer-controller.html 
            //
            albController: { version: eks.AlbControllerVersion.V2_4_1 }
        });
        cluster.connectAutoScalingGroupCapacity(this.provisionASG(), {});
        cdk.Tags.of(cluster).add("application", "dungen-backend");
        this.provisionDynamoAccountsTable();
    }
    provisionASG() {
        const role = new iam.Role(this, 'dungen-backend-asg-role', {
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy')
            ]
        });
        cdk.Tags.of(role).add("application", "dungen-auth");
        const autoscaler = new asg.AutoScalingGroup(this, 'dungen-backend-asg', {
            vpc: this.vpc,
            allowAllOutbound: true,
            role: role,
            maxCapacity: 1,
            minCapacity: 0,
            desiredCapacity: 1,
            updatePolicy: asg.UpdatePolicy.rollingUpdate(),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.NANO),
            machineImage: new eks.EksOptimizedImage({
                cpuArch: eks.CpuArch.ARM_64,
                kubernetesVersion: eks.KubernetesVersion.V1_23.version,
                nodeType: eks.NodeType.STANDARD,
            }),
        });
        cdk.Tags.of(autoscaler).add("application", "dungen-backend");
        return autoscaler;
    }
    provisionDynamoAccountsTable() {
        const table = new ddb.Table(this, "dungen-users-table", {
            tableName: "dungen-users",
            partitionKey: { name: "PK", type: ddb.AttributeType.STRING },
            sortKey: { name: "SK", type: ddb.AttributeType.STRING },
            billingMode: ddb.BillingMode.PROVISIONED,
            readCapacity: 1,
            writeCapacity: 1
        });
        // GSI1 - reverse lookup
        //
        table.addGlobalSecondaryIndex({
            indexName: 'dungen-users-gsi1',
            partitionKey: { name: "SK", type: ddb.AttributeType.STRING },
            sortKey: { name: "PK", type: ddb.AttributeType.STRING },
            projectionType: ddb.ProjectionType.ALL,
            readCapacity: 1,
            writeCapacity: 1
        });
        cdk.Tags.of(table).add("application", "dungen-backend");
    }
}
exports.default = BackendClusterStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2VuZC1jbHVzdGVyLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2JhY2tlbmQtY2x1c3Rlci1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG1DQUFtQztBQUNuQywyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLGdEQUFnRDtBQUNoRCwyQ0FBMkM7QUFDM0MsbURBQW1EO0FBSW5ELE1BQU0sbUJBQW9CLFNBQVEsR0FBRyxDQUFDLEtBQUs7SUFNekMsWUFDRSxLQUFnQixFQUNoQixFQUFVLEVBQ1YsR0FBYSxFQUNiLGFBQTBCLEVBQzFCLFlBQXlCLEVBQ3pCLEtBQXNCO1FBQ3RCLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFFbkIsTUFBTSxPQUFPLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSx3QkFBd0IsRUFBRTtZQUMvRCxPQUFPLEVBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEtBQUs7WUFDcEMsMkNBQTJDO1lBQzNDLEVBQUU7WUFDRixlQUFlLEVBQUUsQ0FBQztZQUNsQixHQUFHLEVBQUUsR0FBRztZQUNSLDZEQUE2RDtZQUM3RCxzQkFBc0I7WUFDdEIsRUFBRTtZQUNGLHFCQUFxQjtZQUNyQix5R0FBeUc7WUFDekcsMkdBQTJHO1lBQzNHLEVBQUU7WUFDRixhQUFhLEVBQUUsRUFBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLG9CQUFvQixDQUFDLE1BQU0sRUFBQztTQUMxRCxDQUFDLENBQUM7UUFFSCxPQUFPLENBQUMsK0JBQStCLENBQUMsSUFBSSxDQUFDLFlBQVks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LENBQUM7WUFDZixhQUFhLEVBQUUsQ0FBQztTQUNqQixDQUFDLENBQUE7UUFFRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLENBQUM7SUFDMUQsQ0FBQztDQUNGO0FBRUQsa0JBQWUsbUJBQW1CLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZWtzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgZGRiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgKiBhcyBhc2cgZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nJztcblxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmNsYXNzIEJhY2tlbmRDbHVzdGVyU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwcml2YXRlIHZwYzogZWMyLklWcGM7XG4gIHByaXZhdGUgcHJpdmF0ZVN1Ym5ldDogZWMyLklTdWJuZXQ7IFxuICBwcml2YXRlIHB1YmxpY1N1Ym5ldDogZWMyLklTdWJuZXQ7XG4gIHByaXZhdGUgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcztcbiBcbiAgY29uc3RydWN0b3IoXG4gICAgc2NvcGU6IENvbnN0cnVjdCwgXG4gICAgaWQ6IHN0cmluZywgXG4gICAgdnBjOiBlYzIuSVZwYywgXG4gICAgcHJpdmF0ZVN1Ym5ldDogZWMyLklTdWJuZXQsIFxuICAgIHB1YmxpY1N1Ym5ldDogZWMyLklTdWJuZXQsXG4gICAgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgdGhpcy52cGMgPSB2cGM7XG4gICAgdGhpcy5wcml2YXRlU3VibmV0ID0gcHJpdmF0ZVN1Ym5ldDtcbiAgICB0aGlzLnB1YmxpY1N1Ym5ldCA9IHB1YmxpY1N1Ym5ldDtcbiAgICB0aGlzLnByb3BzID0gcHJvcHM7XG5cbiAgICBjb25zdCBjbHVzdGVyID0gbmV3IGVrcy5DbHVzdGVyKHNjb3BlLCBcImR1bmdlbi1iYWNrZW5kLWNsdXN0ZXJcIiwge1xuICAgICAgdmVyc2lvbjogZWtzLkt1YmVybmV0ZXNWZXJzaW9uLlYxXzIzLFxuICAgICAgLy8gQWRkaW5nIG91ciBvd24gY2FwYWNpdHkgZm9yIGZ1bGwgY29udHJvbFxuICAgICAgLy9cbiAgICAgIGRlZmF1bHRDYXBhY2l0eTogMCwgICBcbiAgICAgIHZwYzogdnBjLFxuICAgICAgLy8gQ0RLIG5vdyB0YWtlcyBjYXJlIG9mIHRoZSBjb250cm9sbGVyIGluc3RhbGxhdGlvbiBmb3IgdXMuIFxuICAgICAgLy8gUTogV2hpY2ggc3VibmV0Pz8/IFxuICAgICAgLy9cbiAgICAgIC8vIEluc3RhbGxhdGlvbiByZWY6IFxuICAgICAgLy8gIGs4IHZlcnNpb246IGh0dHBzOi8va3ViZXJuZXRlcy1zaWdzLmdpdGh1Yi5pby9hd3MtbG9hZC1iYWxhbmNlci1jb250cm9sbGVyL3YyLjIvZGVwbG95L2luc3RhbGxhdGlvbi8gXG4gICAgICAvLyAgYXdzIHZlcnNpb24gKHNhbWUpOiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvYXdzLWxvYWQtYmFsYW5jZXItY29udHJvbGxlci5odG1sIFxuICAgICAgLy9cbiAgICAgIGFsYkNvbnRyb2xsZXI6IHt2ZXJzaW9uOiBla3MuQWxiQ29udHJvbGxlclZlcnNpb24uVjJfNF8xfVxuICAgIH0pO1xuXG4gICAgY2x1c3Rlci5jb25uZWN0QXV0b1NjYWxpbmdHcm91cENhcGFjaXR5KHRoaXMucHJvdmlzaW9uQVNHKCksIHt9KTtcblxuICAgIGNkay5UYWdzLm9mKGNsdXN0ZXIpLmFkZChcImFwcGxpY2F0aW9uXCIsIFwiZHVuZ2VuLWJhY2tlbmRcIik7XG5cbiAgICB0aGlzLnByb3Zpc2lvbkR5bmFtb0FjY291bnRzVGFibGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgcHJvdmlzaW9uQVNHKCkge1xuICAgIGNvbnN0IHJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ2R1bmdlbi1iYWNrZW5kLWFzZy1yb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2VjMi5hbWF6b25hd3MuY29tJyksXG4gICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcbiAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25FS1NXb3JrZXJOb2RlUG9saWN5JylcbiAgICAgIF1cbiAgICB9KTtcblxuICAgIGNkay5UYWdzLm9mKHJvbGUpLmFkZChcImFwcGxpY2F0aW9uXCIsIFwiZHVuZ2VuLWF1dGhcIik7XG5cbiAgICBjb25zdCBhdXRvc2NhbGVyID0gbmV3IGFzZy5BdXRvU2NhbGluZ0dyb3VwKHRoaXMsICdkdW5nZW4tYmFja2VuZC1hc2cnLCB7XG4gICAgICB2cGM6IHRoaXMudnBjLCBcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IHRydWUsXG4gICAgICByb2xlOiByb2xlLFxuICAgICAgbWF4Q2FwYWNpdHk6IDEsXG4gICAgICBtaW5DYXBhY2l0eTogMCxcbiAgICAgIGRlc2lyZWRDYXBhY2l0eTogMSxcbiAgICAgIHVwZGF0ZVBvbGljeTogYXNnLlVwZGF0ZVBvbGljeS5yb2xsaW5nVXBkYXRlKCksXG4gICAgICBpbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoXG4gICAgICAgIGVjMi5JbnN0YW5jZUNsYXNzLkJVUlNUQUJMRTIsXG4gICAgICAgIGVjMi5JbnN0YW5jZVNpemUuTkFOT1xuICAgICAgKSxcbiAgICAgIG1hY2hpbmVJbWFnZTogbmV3IGVrcy5Fa3NPcHRpbWl6ZWRJbWFnZSh7IFxuICAgICAgICBjcHVBcmNoOiBla3MuQ3B1QXJjaC5BUk1fNjQsXG4gICAgICAgIGt1YmVybmV0ZXNWZXJzaW9uOiBla3MuS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjMudmVyc2lvbixcbiAgICAgICAgbm9kZVR5cGU6IGVrcy5Ob2RlVHlwZS5TVEFOREFSRCxcbiAgICAgICB9KSxcbiAgICB9KVxuXG4gICAgY2RrLlRhZ3Mub2YoYXV0b3NjYWxlcikuYWRkKFwiYXBwbGljYXRpb25cIiwgXCJkdW5nZW4tYmFja2VuZFwiKTtcblxuICAgIHJldHVybiBhdXRvc2NhbGVyO1xuICB9XG5cbiAgcHJpdmF0ZSBwcm92aXNpb25EeW5hbW9BY2NvdW50c1RhYmxlKCkge1xuICAgIGNvbnN0IHRhYmxlID0gbmV3IGRkYi5UYWJsZSh0aGlzLCBcImR1bmdlbi11c2Vycy10YWJsZVwiLCB7XG4gICAgICB0YWJsZU5hbWU6IFwiZHVuZ2VuLXVzZXJzXCIsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtuYW1lOiBcIlBLXCIsIHR5cGU6IGRkYi5BdHRyaWJ1dGVUeXBlLlNUUklOR30sXG4gICAgICBzb3J0S2V5OiB7bmFtZTogXCJTS1wiLCB0eXBlOiBkZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgYmlsbGluZ01vZGU6IGRkYi5CaWxsaW5nTW9kZS5QUk9WSVNJT05FRCxcbiAgICAgIHJlYWRDYXBhY2l0eTogMSxcbiAgICAgIHdyaXRlQ2FwYWNpdHk6IDFcbiAgICB9KTtcblxuICAgIC8vIEdTSTEgLSByZXZlcnNlIGxvb2t1cFxuICAgIC8vXG4gICAgdGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnZHVuZ2VuLXVzZXJzLWdzaTEnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7bmFtZTogXCJTS1wiLCB0eXBlOiBkZGIuQXR0cmlidXRlVHlwZS5TVFJJTkd9LFxuICAgICAgc29ydEtleToge25hbWU6IFwiUEtcIiwgdHlwZTogZGRiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HfSxcbiAgICAgIHByb2plY3Rpb25UeXBlOiBkZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgICAgcmVhZENhcGFjaXR5OiAxLFxuICAgICAgd3JpdGVDYXBhY2l0eTogMVxuICAgIH0pXG5cbiAgICBjZGsuVGFncy5vZih0YWJsZSkuYWRkKFwiYXBwbGljYXRpb25cIiwgXCJkdW5nZW4tYmFja2VuZFwiKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBCYWNrZW5kQ2x1c3RlclN0YWNrO1xuIl19