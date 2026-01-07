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
  ecsSecurityGroupId: pulumi.Output<string>;
  rdsSecurityGroupId: pulumi.Output<string>;

  // ECS
  clusterArn: pulumi.Output<string>;
  clusterName: pulumi.Output<string>;

  // Load Balancer
  albArn: pulumi.Output<string>;
  albDnsName: pulumi.Output<string>;
  albZoneId: pulumi.Output<string>;
  apiTargetGroupArn: pulumi.Output<string>;
  httpListenerArn: pulumi.Output<string>;

  // ECR
  ecrRepositoryUrl: pulumi.Output<string>;
  ecrRepositoryArn: pulumi.Output<string>;

  // IAM
  taskExecutionRoleArn: pulumi.Output<string>;
  taskRoleArn: pulumi.Output<string>;

  // Logging
  logGroupName: pulumi.Output<string>;
  logGroupArn: pulumi.Output<string>;

  // Database
  databaseEndpoint: pulumi.Output<string>;
  databasePort: pulumi.Output<number>;
  databaseName: string;
  databaseUsername: string;
  databaseSecretArn: pulumi.Output<string>;

  // Convenience
  environment: string;
  region: pulumi.Output<string>;
}

/**
 * Configuration options for the shared infrastructure.
 */
export interface SharedInfraConfig {
  /** VPC CIDR block (default: 10.0.0.0/16) */
  vpcCidr?: string;
  /** Number of availability zones (default: 2) */
  azCount?: number;
  /** Enable NAT Gateway (default: true for prod, false for dev) */
  enableNatGateway?: boolean;
  /** Container port for the API (default: 3333) */
  containerPort?: number;
  /** Database name (default: soccer_stats) */
  databaseName?: string;
  /** Database username (default: postgres) */
  databaseUsername?: string;
  /** Use Aurora Serverless v2 instead of standard RDS (default: true for prod, false for dev) */
  useAuroraServerless?: boolean;
  /** Instance class for standard RDS (default: db.t3.micro, ignored for Aurora) */
  databaseInstanceClass?: string;
  /** Min Aurora Capacity Units (default: 0.5, only for Aurora Serverless v2) */
  databaseMinCapacity?: number;
  /** Max Aurora Capacity Units (default: 4, only for Aurora Serverless v2) */
  databaseMaxCapacity?: number;
}
