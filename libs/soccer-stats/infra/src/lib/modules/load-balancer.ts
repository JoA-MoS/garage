import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LoadBalancerConfig {
  namePrefix: string;
  stack: string;
  vpcId: pulumi.Output<string>;
  publicSubnetIds: pulumi.Output<string[]>;
  albSecurityGroupId: pulumi.Output<string>;
  containerPort: number;
  awsProvider: aws.Provider;
}

export interface LoadBalancerOutputs {
  alb: aws.lb.LoadBalancer;
  apiTargetGroup: aws.lb.TargetGroup;
  httpListener: aws.lb.Listener;
  albArn: aws.lb.LoadBalancer['arn'];
  albDnsName: aws.lb.LoadBalancer['dnsName'];
  albZoneId: aws.lb.LoadBalancer['zoneId'];
  apiTargetGroupArn: aws.lb.TargetGroup['arn'];
  httpListenerArn: aws.lb.Listener['arn'];
}

/**
 * Creates Application Load Balancer with target group and listeners.
 */
export function createLoadBalancer(
  config: LoadBalancerConfig,
): LoadBalancerOutputs {
  const {
    namePrefix,
    stack,
    vpcId,
    publicSubnetIds,
    albSecurityGroupId,
    containerPort,
    awsProvider,
  } = config;

  const alb = new aws.lb.LoadBalancer(
    `${namePrefix}-alb`,
    {
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroupId],
      subnets: publicSubnetIds,
      enableHttp2: true,
      idleTimeout: 120, // Higher for WebSocket/GraphQL subscriptions
      tags: { Name: `${namePrefix}-alb`, Environment: stack },
    },
    { provider: awsProvider },
  );

  const apiTargetGroup = new aws.lb.TargetGroup(
    `${namePrefix}-api-tg`,
    {
      port: containerPort,
      protocol: 'HTTP',
      targetType: 'ip',
      vpcId,
      healthCheck: {
        enabled: true,
        path: '/api/health',
        port: 'traffic-port',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      stickiness: { type: 'lb_cookie', enabled: true, cookieDuration: 86400 },
      tags: { Name: `${namePrefix}-api-tg`, Environment: stack },
    },
    { provider: awsProvider },
  );

  const httpListener = new aws.lb.Listener(
    `${namePrefix}-http-listener`,
    {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [{ type: 'forward', targetGroupArn: apiTargetGroup.arn }],
    },
    { provider: awsProvider },
  );

  return {
    alb,
    apiTargetGroup,
    httpListener,
    albArn: alb.arn,
    albDnsName: alb.dnsName,
    albZoneId: alb.zoneId,
    apiTargetGroupArn: apiTargetGroup.arn,
    httpListenerArn: httpListener.arn,
  };
}
