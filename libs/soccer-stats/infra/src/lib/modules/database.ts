import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as random from '@pulumi/random';

export interface DatabaseConfig {
  namePrefix: string;
  stack: string;
  privateSubnetIds: pulumi.Output<string[]>;
  publicSubnetIds: pulumi.Output<string[]>;
  rdsSecurityGroupId: pulumi.Output<string>;
  dbName: string;
  dbUsername: string;
  useAurora: boolean;
  dbInstanceClass: string;
  dbMinCapacity: number;
  dbMaxCapacity: number;
  awsProvider: aws.Provider;
  /** Allow direct connections from the internet (dev only - for local development) */
  publiclyAccessible?: boolean;
}

export interface DatabaseOutputs {
  dbEndpoint: pulumi.Output<string>;
  dbPort: pulumi.Output<number>;
  dbSecret: aws.secretsmanager.Secret;
  databaseName: string;
  databaseUsername: string;
  databaseSecretArn: pulumi.Output<string>;
}

/**
 * Creates database infrastructure - either Aurora Serverless v2 or Standard RDS.
 * Aurora is used for production (auto-scaling), Standard RDS for dev (cost-effective).
 */
export function createDatabase(config: DatabaseConfig): DatabaseOutputs {
  const {
    namePrefix,
    stack,
    privateSubnetIds,
    publicSubnetIds,
    rdsSecurityGroupId,
    dbName,
    dbUsername,
    useAurora,
    dbInstanceClass,
    dbMinCapacity,
    dbMaxCapacity,
    awsProvider,
    publiclyAccessible = false,
  } = config;

  // DB Subnet Group - requires subnets in at least 2 AZs
  // Use public subnets when publiclyAccessible is true (for dev local access)
  const subnetIds = publiclyAccessible ? publicSubnetIds : privateSubnetIds;
  const subnetGroupSuffix = publiclyAccessible ? 'public' : 'private';

  const dbSubnetGroup = new aws.rds.SubnetGroup(
    `${namePrefix}-db-subnet-group-${subnetGroupSuffix}`,
    {
      subnetIds: subnetIds,
      description: `Database subnet group for ${namePrefix} (${subnetGroupSuffix})`,
      tags: { Name: `${namePrefix}-db-subnet-group`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Generate random password for database
  const dbPassword = new random.RandomPassword(`${namePrefix}-db-password`, {
    length: 32,
    special: true,
    overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
  });

  // Store credentials in Secrets Manager
  const dbSecret = new aws.secretsmanager.Secret(
    `${namePrefix}-db-secret`,
    {
      name: `${namePrefix}/database`,
      description: `Database credentials for ${namePrefix}`,
      tags: { Name: `${namePrefix}-db-secret`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Database outputs - will be set based on which DB type is created
  let dbEndpoint: pulumi.Output<string>;
  let dbPort: pulumi.Output<number>;

  if (useAurora) {
    const result = createAuroraCluster({
      namePrefix,
      stack,
      dbSubnetGroup,
      rdsSecurityGroupId,
      dbName,
      dbUsername,
      dbPassword,
      dbMinCapacity,
      dbMaxCapacity,
      awsProvider,
    });
    dbEndpoint = result.endpoint;
    dbPort = result.port;
  } else {
    const result = createStandardRds({
      namePrefix,
      stack,
      dbSubnetGroup,
      rdsSecurityGroupId,
      dbName,
      dbUsername,
      dbPassword,
      dbInstanceClass,
      awsProvider,
      publiclyAccessible,
    });
    dbEndpoint = result.endpoint;
    dbPort = result.port;
  }

  // Store the full connection details in Secrets Manager
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dbSecretVersion = new aws.secretsmanager.SecretVersion(
    `${namePrefix}-db-secret-version`,
    {
      secretId: dbSecret.id,
      secretString: pulumi
        .all([dbEndpoint, dbPort, dbPassword.result])
        .apply(([endpoint, port, password]) =>
          JSON.stringify({
            host: endpoint,
            port: port,
            database: dbName,
            username: dbUsername,
            password: password,
            // TypeORM-compatible connection URL
            url: `postgresql://${dbUsername}:${encodeURIComponent(password)}@${endpoint}:${port}/${dbName}`,
          }),
        ),
    },
    { provider: awsProvider },
  );

  return {
    dbEndpoint,
    dbPort,
    dbSecret,
    databaseName: dbName,
    databaseUsername: dbUsername,
    databaseSecretArn: dbSecret.arn,
  };
}

interface AuroraConfig {
  namePrefix: string;
  stack: string;
  dbSubnetGroup: aws.rds.SubnetGroup;
  rdsSecurityGroupId: pulumi.Output<string>;
  dbName: string;
  dbUsername: string;
  dbPassword: random.RandomPassword;
  dbMinCapacity: number;
  dbMaxCapacity: number;
  awsProvider: aws.Provider;
}

/**
 * Creates Aurora Serverless v2 cluster (for production - auto-scales with load).
 */
function createAuroraCluster(config: AuroraConfig): {
  endpoint: pulumi.Output<string>;
  port: pulumi.Output<number>;
} {
  const {
    namePrefix,
    stack,
    dbSubnetGroup,
    rdsSecurityGroupId,
    dbName,
    dbUsername,
    dbPassword,
    dbMinCapacity,
    dbMaxCapacity,
    awsProvider,
  } = config;

  // Aurora PostgreSQL versions lag behind standard RDS - use latest available
  const auroraCluster = new aws.rds.Cluster(
    `${namePrefix}-aurora-cluster`,
    {
      clusterIdentifier: `${namePrefix}-aurora`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '16.6',
      databaseName: dbName,
      masterUsername: dbUsername,
      masterPassword: dbPassword.result,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroupId],
      serverlessv2ScalingConfiguration: {
        minCapacity: dbMinCapacity,
        maxCapacity: dbMaxCapacity,
      },
      storageEncrypted: true,
      skipFinalSnapshot: stack !== 'prod',
      finalSnapshotIdentifier:
        stack === 'prod' ? `${namePrefix}-final-snapshot` : undefined,
      backupRetentionPeriod: stack === 'prod' ? 7 : 1,
      deletionProtection: stack === 'prod',
      tags: { Name: `${namePrefix}-aurora-cluster`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Aurora requires at least one instance
  new aws.rds.ClusterInstance(
    `${namePrefix}-aurora-instance`,
    {
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: auroraCluster.engineVersion,
      dbSubnetGroupName: dbSubnetGroup.name,
      publiclyAccessible: false,
      tags: { Name: `${namePrefix}-aurora-instance`, Environment: stack },
    },
    { provider: awsProvider },
  );

  return {
    endpoint: auroraCluster.endpoint,
    port: pulumi.output(5432),
  };
}

interface StandardRdsConfig {
  namePrefix: string;
  stack: string;
  dbSubnetGroup: aws.rds.SubnetGroup;
  rdsSecurityGroupId: pulumi.Output<string>;
  dbName: string;
  dbUsername: string;
  dbPassword: random.RandomPassword;
  dbInstanceClass: string;
  awsProvider: aws.Provider;
  publiclyAccessible: boolean;
}

/**
 * Creates Standard RDS PostgreSQL instance (for dev - much cheaper at ~$13/month).
 */
function createStandardRds(config: StandardRdsConfig): {
  endpoint: pulumi.Output<string>;
  port: pulumi.Output<number>;
} {
  const {
    namePrefix,
    stack,
    dbSubnetGroup,
    rdsSecurityGroupId,
    dbName,
    dbUsername,
    dbPassword,
    dbInstanceClass,
    awsProvider,
    publiclyAccessible,
  } = config;

  const rdsInstance = new aws.rds.Instance(
    `${namePrefix}-rds`,
    {
      identifier: `${namePrefix}-postgres`,
      engine: 'postgres',
      engineVersion: '16.6',
      instanceClass: dbInstanceClass,
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling
      storageType: 'gp3',
      dbName: dbName,
      username: dbUsername,
      password: dbPassword.result,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroupId],
      publiclyAccessible: publiclyAccessible,
      storageEncrypted: true,
      skipFinalSnapshot: stack !== 'prod',
      finalSnapshotIdentifier:
        stack === 'prod' ? `${namePrefix}-final-snapshot` : undefined,
      backupRetentionPeriod: stack === 'prod' ? 7 : 1,
      deletionProtection: stack === 'prod',
      performanceInsightsEnabled: stack === 'prod',
      multiAz: stack === 'prod',
      tags: { Name: `${namePrefix}-rds`, Environment: stack },
    },
    {
      provider: awsProvider,
      // Force replacement when subnet group changes (AWS doesn't allow in-place updates)
      replaceOnChanges: ['dbSubnetGroupName'],
    },
  );

  return {
    endpoint: rdsInstance.address,
    port: rdsInstance.port,
  };
}
