import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class AwsCdkEc2GitlabStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Parameters
    const region = 'ap-northeast-1';

    const imageId = 'ami-09829527b1a93f365'

    const ec2InstanceType = new cdk.CfnParameter(this, 'EC2InstanceType', {
      type: 'String',
      description: 'EC2 instance type on which IDE runs',
      default: 'g4dn.xlarge',
    });

    const volumeSize = new cdk.CfnParameter(this, 'VolumeSize', {
      type: 'Number',
      description: 'root volume size',
      default: 100,
    });

    const vpcId = new cdk.CfnParameter(this, 'VPCId', {
      type: 'String',
      description: 'VPC ID where the instance will be launched',
      default: 'vpc-00519c9e9aeed029b',
    });

    const subnetId = new cdk.CfnParameter(this, 'SubnetId', {
      type: 'String',
      description: 'Public subnet in vpc',
      default: 'subnet-0fc5021171747ca4d',
    });

    const subnet = ec2.Subnet.fromSubnetAttributes(this, 'ImportedSubnet', {
      subnetId: subnetId.valueAsString,
      availabilityZone: 'ap-northeast-1a',  // 実際の可用性ゾーンに合わせて調整してください
    });

    // VPC
    const vpc = ec2.Vpc.fromVpcAttributes(this, 'ImportedVPC', {
      vpcId: vpcId.valueAsString,
      availabilityZones: ['ap-northeast-1a'],
    });

    // IAM Role
    const role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('ec2.amazonaws.com'),
        new iam.ServicePrincipal('sagemaker.amazonaws.com')
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeCommitFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('EC2InstanceProfileForImageBuilderECRContainerBuilds'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('SecretsManagerReadWrite'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
      ],
    });

    // Security Group
    const securityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'for remote development',
      allowAllOutbound: true,
    });

    // Key Pair
    const keyPair = new ec2.CfnKeyPair(this, 'NewKeyPair', {
      keyName: `${this.stackName}-cf-key`,
    });

    // EC2 Instance
    const instance = new ec2.Instance(this, 'EC2Instance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.G4DN, ec2.InstanceSize.XLARGE),
      machineImage: ec2.MachineImage.genericLinux({ [region]: imageId }),
      vpc,
      vpcSubnets: { subnets: [subnet] },
      role,
      securityGroup,
      keyName: keyPair.keyName,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(volumeSize.valueAsNumber, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            deleteOnTermination: true,
            encrypted: false,
          }),
        },
      ],
    });

    // User Data
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'export HOME=/home/ubuntu',
      'echo upgrade git',
      'sudo -E add-apt-repository ppa:git-core/ppa -y',
      'sudo apt-get update && sudo apt-get -y upgrade',
      'git config --global init.defaultBranch main',
      'echo setup git credential',
      'git config --global credential.helper \'!aws codecommit credential-helper $@\'',
      'git config --global credential.UseHttpPath true',
      'echo uninstall awscli v1',
      'sudo rm -rf /usr/local/aws',
      'sudo rm /usr/local/bin/aws',
      'sudo rm -r ~/.aws/',
      'echo install awscli v2',
      'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"',
      'unzip awscliv2.zip',
      'sudo ./aws/install --bin-dir /usr/local/bin --install-dir /usr/local/aws-cli --update',
      'sudo rm aws/ -r',
      'sudo rm awscliv2.zip',
      'echo init conda',
      'conda init bash',
      'sudo reboot'
    );
    instance.addUserData(userData.render());

    // Outputs
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'The Instance ID',
    });

    new cdk.CfnOutput(this, 'InstanceRoleArn', {
      value: role.roleArn,
      description: 'The Instance Role ARN',
    });

    new cdk.CfnOutput(this, 'KeyID', {
      value: keyPair.attrKeyPairId,
      description: 'The Key ID',
    });
  }
}
