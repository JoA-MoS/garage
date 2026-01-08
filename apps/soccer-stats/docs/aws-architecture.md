# Soccer Stats AWS Architecture

## Overview

The soccer-stats application runs on AWS using a serverless-first architecture optimized for cost efficiency during the beta phase.

## Architecture Diagram

```mermaid
flowchart TB
    subgraph Internet
        Users([Users])
    end

    subgraph AWS Cloud
        subgraph Edge["Edge (Global)"]
            CF[CloudFront Distribution]
        end

        subgraph Region["Region (us-west-2)"]
            subgraph VPC["VPC (10.0.0.0/16)"]
                subgraph PublicSubnets["Public Subnets"]
                    ALB[Application Load Balancer]
                end

                subgraph PrivateSubnets["Private Subnets"]
                    subgraph ECS["ECS Cluster (Fargate Spot)"]
                        Service["ECS Service<br/>(Auto-scaling 1-4 tasks)"]
                        Task1["API Task<br/>0.25 vCPU / 512MB"]
                        Task2["API Task<br/>(scaled on demand)"]
                    end

                    subgraph Database["Database"]
                        Aurora["Aurora Serverless v2<br/>PostgreSQL 16.6<br/>(0.5-4 ACUs)"]
                    end
                end
            end

            subgraph Storage["Storage & Registry"]
                S3["S3 Bucket<br/>(UI Static Assets)"]
                ECR["ECR Repository<br/>(API Docker Images)"]
            end

            subgraph Security["Security & Secrets"]
                SM["Secrets Manager<br/>• DB Credentials<br/>• Clerk Auth Keys"]
            end

            subgraph Monitoring["Monitoring"]
                CW["CloudWatch Logs<br/>/ecs/soccer-stats-*"]
            end
        end
    end

    %% Traffic Flow
    Users -->|HTTPS| CF
    CF -->|/api/*| ALB
    CF -->|Static Assets| S3
    ALB -->|Port 3333| Service
    Service --> Task1
    Service -.-> Task2
    Task1 -->|Port 5432| Aurora
    Task2 -.->|Port 5432| Aurora

    %% Supporting Services
    Task1 -->|Pull Image| ECR
    Task1 -->|Get Secrets| SM
    Task1 -->|Logs| CW
    Service -->|Auto-scale<br/>CPU > 70%| Task2

    %% Styling
    classDef spot fill:#ff9900,stroke:#232f3e,color:#232f3e
    classDef serverless fill:#3b48cc,stroke:#232f3e,color:#fff
    classDef storage fill:#3c873a,stroke:#232f3e,color:#fff
    classDef edge fill:#8c4fff,stroke:#232f3e,color:#fff

    class Task1,Task2,Service spot
    class Aurora serverless
    class S3,ECR storage
    class CF edge
```

## Component Details

### Edge Layer

| Component      | Purpose       | Configuration                                                   |
| -------------- | ------------- | --------------------------------------------------------------- |
| **CloudFront** | CDN & routing | HTTPS termination, caches static assets, routes `/api/*` to ALB |

### Compute Layer

| Component       | Purpose                 | Configuration                                          |
| --------------- | ----------------------- | ------------------------------------------------------ |
| **ECS Cluster** | Container orchestration | Fargate Spot capacity provider (60-70% cost savings)   |
| **ECS Service** | API deployment          | Auto-scaling 1-4 tasks based on CPU utilization        |
| **API Task**    | NestJS GraphQL API      | 0.25 vCPU, 512MB memory, health check on `/api/health` |

### Data Layer

| Component                | Purpose             | Configuration                               |
| ------------------------ | ------------------- | ------------------------------------------- |
| **Aurora Serverless v2** | PostgreSQL database | 0.5-4 ACUs auto-scaling, encrypted at rest  |
| **S3 Bucket**            | UI static hosting   | Private bucket, accessed via CloudFront OAC |
| **ECR**                  | Docker registry     | Image scanning, 10-image lifecycle policy   |

### Security

| Component              | Purpose                               |
| ---------------------- | ------------------------------------- |
| **ALB Security Group** | Allow HTTP/HTTPS from internet        |
| **ECS Security Group** | Allow port 3333 from ALB only         |
| **RDS Security Group** | Allow port 5432 from ECS only         |
| **Secrets Manager**    | Store DB credentials & Clerk API keys |

## Auto-Scaling Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    Auto-Scaling Policy                       │
├─────────────────────────────────────────────────────────────┤
│  Metric: ECSServiceAverageCPUUtilization                    │
│  Target: 70%                                                 │
│                                                              │
│  Min Capacity: 1 task    ─────────────────────────────────  │
│  Max Capacity: 4 tasks   ═════════════════════════════════  │
│                                                              │
│  Scale-out Cooldown: 60 seconds  (respond quickly)          │
│  Scale-in Cooldown: 300 seconds  (avoid flapping)           │
└─────────────────────────────────────────────────────────────┘
```

## Cost Optimization (Beta Phase)

| Strategy                 | Savings                 | Trade-off                                                  |
| ------------------------ | ----------------------- | ---------------------------------------------------------- |
| **Fargate Spot**         | 60-70%                  | 2-min interruption notice (mitigated by ALB health checks) |
| **Aurora Serverless v2** | Pay per ACU-hour        | Scales to 0.5 ACU during low usage                         |
| **Single-task baseline** | Minimal fixed cost      | Scales up only when needed                                 |
| **CloudFront caching**   | Reduced origin requests | Static assets served from edge                             |

## Network Flow

```
User Request Flow:
──────────────────
1. User → CloudFront (HTTPS)
2. CloudFront checks cache
   ├─ Cache HIT → Return cached response
   └─ Cache MISS:
      ├─ /api/* → ALB → ECS Task → Aurora
      └─ /* → S3 (static assets)

API Request Path:
─────────────────
CloudFront → ALB (HTTP) → ECS Task:3333 → Aurora:5432
     │                         │
     └── TLS termination       └── Secrets from SM
```

## Environment Differences

| Aspect                 | Development     | Production           |
| ---------------------- | --------------- | -------------------- |
| Capacity Provider      | FARGATE_SPOT    | FARGATE_SPOT (beta)  |
| Database               | RDS db.t3.micro | Aurora Serverless v2 |
| Subnets                | Public (no NAT) | Private (with NAT)   |
| Container Insights     | Disabled        | Enabled              |
| Log Retention          | 7 days          | 30 days              |
| CloudFront Price Class | PriceClass_100  | PriceClass_All       |
