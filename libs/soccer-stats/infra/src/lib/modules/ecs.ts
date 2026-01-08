import * as aws from '@pulumi/aws';

export interface EcsConfig {
  namePrefix: string;
  stack: string;
  awsProvider: aws.Provider;
}

export interface EcsOutputs {
  cluster: aws.ecs.Cluster;
  clusterArn: aws.ecs.Cluster['arn'];
  clusterName: aws.ecs.Cluster['name'];
}

/**
 * Creates ECS cluster with Fargate capacity providers.
 */
export function createEcsCluster(config: EcsConfig): EcsOutputs {
  const { namePrefix, stack, awsProvider } = config;

  const cluster = new aws.ecs.Cluster(
    `${namePrefix}-cluster`,
    {
      settings: [
        {
          name: 'containerInsights',
          value: stack === 'prod' ? 'enabled' : 'disabled',
        },
      ],
      tags: { Name: `${namePrefix}-cluster`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Configure capacity providers - use FARGATE_SPOT for all environments
  // Beta phase: Minimal usage with weekend spikes makes Spot ideal for cost savings
  // TODO: Re-evaluate for prod when usage stabilizes post-beta
  new aws.ecs.ClusterCapacityProviders(
    `${namePrefix}-cluster-capacity`,
    {
      clusterName: cluster.name,
      capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
      defaultCapacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 1,
          base: 1,
        },
      ],
    },
    { provider: awsProvider },
  );

  return {
    cluster,
    clusterArn: cluster.arn,
    clusterName: cluster.name,
  };
}
