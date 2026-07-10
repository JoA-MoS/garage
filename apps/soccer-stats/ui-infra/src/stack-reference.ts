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
 *
 * @param organization - Your Pulumi organization name
 */
export function getSharedInfraStackReference(
  organization?: string,
): StrongTypedStackReference {
  const config = new pulumi.Config();
  const org = organization || config.get('pulumiOrganization') || 'JoA-MoS';
  const stack = pulumi.getStack();

  return new pulumi.StackReference(
    `${org}/soccer-stats-infra/${stack}`,
  ) as StrongTypedStackReference;
}

/** Reference to the api-infra stack to get the App Runner service URL. */
export function getApiInfraStackReference(
  organization?: string,
): pulumi.StackReference {
  const config = new pulumi.Config();
  const org = organization || config.get('pulumiOrganization') || 'JoA-MoS';
  const stack = pulumi.getStack();
  return new pulumi.StackReference(`${org}/soccer-stats-api-infra/${stack}`);
}
