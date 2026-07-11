import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface GithubOidcConfig {
  namePrefix: string;
  stack: string;
  /** GitHub repository in "owner/repo" form */
  githubRepo: string;
  /** Git refs allowed to assume the CD role (default: main branch only) */
  allowedRefs?: string[];
  awsProvider: aws.Provider;
}

export interface GithubOidcOutputs {
  cdRole: aws.iam.Role;
  cdRoleArn: pulumi.Output<string>;
}

/**
 * Creates a GitHub Actions OIDC identity provider and a CD role that
 * workflows can assume with `aws-actions/configure-aws-credentials` —
 * no long-lived AWS keys stored in GitHub.
 *
 * The trust policy is scoped to specific refs of one repository. The role
 * carries PowerUserAccess plus the IAM actions Pulumi needs to manage the
 * stacks' roles/instance profiles (account-wide resource scope — acceptable
 * for a single-owner account; scope down if the account gains tenants).
 */
export function createGithubOidc(config: GithubOidcConfig): GithubOidcOutputs {
  const {
    namePrefix,
    stack,
    githubRepo,
    allowedRefs = ['refs/heads/main'],
    awsProvider,
  } = config;

  const oidcProvider = new aws.iam.OpenIdConnectProvider(
    `${namePrefix}-github-oidc`,
    {
      url: 'https://token.actions.githubusercontent.com',
      clientIdLists: ['sts.amazonaws.com'],
      // AWS validates GitHub's cert against trusted roots since 2023;
      // the thumbprint is still a required field.
      thumbprintLists: ['6938fd4d98bab03faadb97b34396831e3780aea1'],
      tags: { Name: `${namePrefix}-github-oidc`, Environment: stack },
    },
    { provider: awsProvider },
  );

  const cdRole = new aws.iam.Role(
    `${namePrefix}-cd-role`,
    {
      description: `GitHub Actions CD role for ${githubRepo}`,
      maxSessionDuration: 3600,
      assumeRolePolicy: pulumi.jsonStringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Federated: oidcProvider.arn },
            Action: 'sts:AssumeRoleWithWebIdentity',
            Condition: {
              StringEquals: {
                'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
              },
              StringLike: {
                'token.actions.githubusercontent.com:sub': allowedRefs.map(
                  (ref) => `repo:${githubRepo}:ref:${ref}`,
                ),
              },
            },
          },
        ],
      }),
      tags: { Name: `${namePrefix}-cd-role`, Environment: stack },
    },
    { provider: awsProvider },
  );

  new aws.iam.RolePolicyAttachment(
    `${namePrefix}-cd-poweruser`,
    {
      role: cdRole.name,
      policyArn: 'arn:aws:iam::aws:policy/PowerUserAccess',
    },
    { provider: awsProvider },
  );

  // PowerUserAccess excludes IAM; Pulumi manages roles/profiles for the stacks
  new aws.iam.RolePolicy(
    `${namePrefix}-cd-iam-policy`,
    {
      role: cdRole.name,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'iam:CreateRole',
              'iam:DeleteRole',
              'iam:GetRole',
              'iam:UpdateRole',
              'iam:UpdateAssumeRolePolicy',
              'iam:TagRole',
              'iam:UntagRole',
              'iam:PutRolePolicy',
              'iam:GetRolePolicy',
              'iam:DeleteRolePolicy',
              'iam:ListRolePolicies',
              'iam:AttachRolePolicy',
              'iam:DetachRolePolicy',
              'iam:ListAttachedRolePolicies',
              'iam:ListInstanceProfilesForRole',
              'iam:PassRole',
              'iam:CreateInstanceProfile',
              'iam:DeleteInstanceProfile',
              'iam:GetInstanceProfile',
              'iam:AddRoleToInstanceProfile',
              'iam:RemoveRoleFromInstanceProfile',
              'iam:TagInstanceProfile',
              'iam:GetOpenIDConnectProvider',
              'iam:TagOpenIDConnectProvider',
            ],
            Resource: '*',
          },
        ],
      }),
    },
    { provider: awsProvider },
  );

  return {
    cdRole,
    cdRoleArn: cdRole.arn,
  };
}
