import {
  GitLabClientConfig,
  GitLabProject,
  GitLabIssue,
  GitLabMergeRequest,
  GitLabPipeline,
} from '@garage/types';

export class GitLabClient {
  private readonly baseUrl: string;
  private readonly token: string;

  constructor(config: GitLabClientConfig) {
    this.baseUrl = config.gitlabUrl.replace(/\/$/, '');
    this.token = config.gitlabToken;
  }

  private async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GitLab API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
    }

    return result.data;
  }

  async getProjects(first = 20): Promise<GitLabProject[]> {
    const query = `
      query getProjects($first: Int!) {
        projects(first: $first) {
          nodes {
            id
            name
            description
            webUrl
            namespace {
              fullPath
            }
          }
        }
      }
    `;

    const data = await this.query<{ projects: { nodes: GitLabProject[] } }>(query, { first });
    return data.projects.nodes;
  }

  async getProject(fullPath: string): Promise<GitLabProject | null> {
    const query = `
      query getProject($fullPath: ID!) {
        project(fullPath: $fullPath) {
          id
          name
          description
          webUrl
          namespace {
            fullPath
          }
        }
      }
    `;

    const data = await this.query<{ project: GitLabProject | null }>(query, { fullPath });
    return data.project;
  }

  async getIssues(projectPath: string, first = 20): Promise<GitLabIssue[]> {
    const query = `
      query getIssues($projectPath: ID!, $first: Int!) {
        project(fullPath: $projectPath) {
          issues(first: $first) {
            nodes {
              id
              iid
              title
              description
              state
              webUrl
              author {
                name
                username
              }
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const data = await this.query<{ project: { issues: { nodes: GitLabIssue[] } } }>(query, {
      projectPath,
      first,
    });
    return data.project.issues.nodes;
  }

  async getMergeRequests(projectPath: string, first = 20): Promise<GitLabMergeRequest[]> {
    const query = `
      query getMergeRequests($projectPath: ID!, $first: Int!) {
        project(fullPath: $projectPath) {
          mergeRequests(first: $first) {
            nodes {
              id
              iid
              title
              description
              state
              webUrl
              author {
                name
                username
              }
              sourceBranch
              targetBranch
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const data = await this.query<{ project: { mergeRequests: { nodes: GitLabMergeRequest[] } } }>(
      query,
      {
        projectPath,
        first,
      }
    );
    return data.project.mergeRequests.nodes;
  }

  async getPipelines(projectPath: string, first = 20): Promise<GitLabPipeline[]> {
    const query = `
      query getPipelines($projectPath: ID!, $first: Int!) {
        project(fullPath: $projectPath) {
          pipelines(first: $first) {
            nodes {
              id
              iid
              status
              ref
              webUrl
              createdAt
              updatedAt
            }
          }
        }
      }
    `;

    const data = await this.query<{ project: { pipelines: { nodes: GitLabPipeline[] } } }>(query, {
      projectPath,
      first,
    });
    return data.project.pipelines.nodes;
  }
}

