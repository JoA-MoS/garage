import * as pulumi from '@pulumi/pulumi';

/**
 * Output types from the shared infrastructure stack.
 * These types are used for strongly-typed StackReferences.
 */
export interface SharedInfraOutputs {
  // VPC
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  privateSubnetIds: pulumi.Output<string[]>;

  // Security Groups
  albSecurityGroupId: pulumi.Output<string>;
  fargateSecurityGroupId: pulumi.Output<string>;
  rdsSecurityGroupId: pulumi.Output<string>;

  // IAM
  ecsTaskExecutionRoleArn: pulumi.Output<string>;
  ecsTaskRoleArn: pulumi.Output<string>;

  // ECR
  ecrRepositoryUrl: pulumi.Output<string>;
  ecrRepositoryArn: pulumi.Output<string>;

  // Database
  databaseEndpoint: pulumi.Output<string>;
  databasePort: pulumi.Output<number>;
  databaseName: string;
  databaseUsername: string;
  databaseSecretArn: pulumi.Output<string>;
  databaseUrlSecretArn: pulumi.Output<string>;

  // Bastion
  bastionInstanceId: pulumi.Output<string>;

  // CI/CD
  cdRoleArn: pulumi.Output<string>;

  // Convenience
  environment: string;
  region: pulumi.Output<string>;
}

export interface SharedInfraConfig {
  vpcCidr?: string;
  azCount?: number;
  enableNatGateway?: boolean;
  containerPort?: number;
  databaseName?: string;
  databaseUsername?: string;
  /** Min Aurora ACU (default: 0 — scale to zero) */
  databaseMinCapacity?: number;
  /** Max Aurora ACU (default: 4) */
  databaseMaxCapacity?: number;
}
