ARG KANIKO_VERSION=latest
ARG NODE_VERSION=18.13.0

# First stage: Use the Kaniko executor image
FROM gcr.io/kaniko-project/executor:${KANIKO_VERSION} as kaniko


# Second stage: Start from the Node.js version 18.13.0 base image
FROM node:${NODE_VERSION}

# Copy the Kaniko executor from the first stage
COPY --from=kaniko /kaniko /kaniko

# Set environment variables for Kaniko
ENV HOME=/root
ENV PATH=/kaniko:$PATH
ENV SSL_CERT_DIR=/kaniko/ssl/certs
ENV DOCKER_CONFIG /kaniko/.docker/

WORKDIR /workspace

# Or set Kaniko as the default entry point
ENTRYPOINT ["/kaniko/executor"]
