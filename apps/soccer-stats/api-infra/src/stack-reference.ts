import * as pulumi from '@pulumi/pulumi';

import type { SharedInfraOutputs } from '@garage/soccer-stats/infra';

// Create strongly-typed StackReference using the library's output types
type SharedInfraKey = keyof SharedInfraOutputs;
type SharedInfraValue<TKey extends SharedInfraKey> = SharedInfraOutputs[TKey];

type StrongTypedStackReference = Omit<
  pulumi.StackReference,
  'getOutput' | 'requireOutput'
> & {
  getOutput<T extends SharedInfraKey>(
    name: pulumi.Input<T>,
  ): SharedInfraValue<T>;
  requireOutput<T extends SharedInfraKey>(
    name: pulumi.Input<T>,
  ): SharedInfraValue<T>;
};

/**
 * Get a strongly-typed reference to the shared infrastructure stack.
 * This allows api-infra to access VPC, ECS cluster, ALB, etc. from the shared stack.
 *
 * @param organization - Your Pulumi organization name (default: from config or 'organization')
 */
export function getSharedInfraStackReference(
  organization?: string,
): StrongTypedStackReference {
  const config = new pulumi.Config();
  const org = organization || config.get('pulumiOrganization') || 'JoA-MoS-org';
  const stack = pulumi.getStack();

  // Reference format: {org}/{project}/{stack}
  return new pulumi.StackReference(
    `${org}/soccer-stats-infra/${stack}`,
  ) as StrongTypedStackReference;
}
