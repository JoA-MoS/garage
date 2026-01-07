import * as aws from '@pulumi/aws';

export interface EcrConfig {
  namePrefix: string;
  stack: string;
  awsProvider: aws.Provider;
}

export interface EcrOutputs {
  repository: aws.ecr.Repository;
  repositoryUrl: aws.ecr.Repository['repositoryUrl'];
  repositoryArn: aws.ecr.Repository['arn'];
}

/**
 * Creates ECR repository with lifecycle policy.
 */
export function createEcrRepository(config: EcrConfig): EcrOutputs {
  const { namePrefix, stack, awsProvider } = config;

  const repository = new aws.ecr.Repository(
    `${namePrefix}-api`,
    {
      name: `soccer-stats-api-${stack}`,
      imageTagMutability: 'MUTABLE',
      imageScanningConfiguration: { scanOnPush: stack === 'prod' },
      tags: { Name: `${namePrefix}-api`, Environment: stack },
    },
    { provider: awsProvider },
  );

  // Lifecycle policy to keep only last 10 images
  new aws.ecr.LifecyclePolicy(
    `${namePrefix}-api-lifecycle`,
    {
      repository: repository.name,
      policy: JSON.stringify({
        rules: [
          {
            rulePriority: 1,
            description: 'Keep last 10 images',
            selection: {
              tagStatus: 'any',
              countType: 'imageCountMoreThan',
              countNumber: 10,
            },
            action: { type: 'expire' },
          },
        ],
      }),
    },
    { provider: awsProvider },
  );

  return {
    repository,
    repositoryUrl: repository.repositoryUrl,
    repositoryArn: repository.arn,
  };
}
