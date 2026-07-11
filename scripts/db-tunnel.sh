#!/usr/bin/env bash
# db-tunnel.sh — Open an SSM port-forward tunnel to Aurora via the bastion.
#
# Usage: ./scripts/db-tunnel.sh [dev|prod]
# Then connect your DB client to localhost:5432
#
# Prerequisites:
#   - AWS CLI configured with appropriate credentials
#   - Session Manager plugin: https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

set -euo pipefail

STACK="${1:-dev}"
NAME_PREFIX="soccer-stats-${STACK}"
LOCAL_PORT=5432

echo "Looking up bastion instance for stack: ${STACK}..."

INSTANCE_ID=$(aws ec2 describe-instances \
  --filters \
    "Name=tag:Name,Values=${NAME_PREFIX}-bastion" \
    "Name=instance-state-name,Values=running" \
  --query "Reservations[0].Instances[0].InstanceId" \
  --output text)

if [ "$INSTANCE_ID" = "None" ] || [ -z "$INSTANCE_ID" ]; then
  echo "ERROR: No running bastion found with tag Name=${NAME_PREFIX}-bastion"
  exit 1
fi

echo "Looking up Aurora endpoint for stack: ${STACK}..."

AURORA_ENDPOINT=$(aws rds describe-db-clusters \
  --filters "Name=db-cluster-id,Values=${NAME_PREFIX}-aurora" \
  --query "DBClusters[0].Endpoint" \
  --output text)

if [ "$AURORA_ENDPOINT" = "None" ] || [ -z "$AURORA_ENDPOINT" ]; then
  echo "ERROR: No Aurora cluster found with id=${NAME_PREFIX}-aurora"
  exit 1
fi

echo "Bastion:  ${INSTANCE_ID}"
echo "Aurora:   ${AURORA_ENDPOINT}:5432"
echo "Tunnel:   localhost:${LOCAL_PORT} -> ${AURORA_ENDPOINT}:5432"
echo ""
echo "Connect your DB client to: localhost:${LOCAL_PORT}"
echo "Credentials: pulumi stack output databaseSecretArn (then aws secretsmanager get-secret-value)"
echo ""
echo "Starting tunnel (Ctrl+C to stop)..."

aws ssm start-session \
  --target "${INSTANCE_ID}" \
  --document-name AWS-StartPortForwardingSessionToRemoteHost \
  --parameters "{\"host\":[\"${AURORA_ENDPOINT}\"],\"portNumber\":[\"5432\"],\"localPortNumber\":[\"${LOCAL_PORT}\"]}"
