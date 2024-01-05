# Start with an alpine based image with both node and kaniko installed and add other build tools as needed
FROM gperdomor/nx-kaniko:18.13.0-alpine

##### Zscaler #####
# ARG IS_LOCAL=false
# ARG TMO_PEM=/usr/local/share/ca-certificates/t-mobile-usa-enterprise-root-ca.pem

# COPY scripts/docker/utils/ /tmp/scripts/
# # Using glob pattern to not error when certs directory is missing
# COPY dist/cert[s]/t-mobile-usa-enterprise-root-ca.pem /usr/local/share/ca-certificates/

# RUN /tmp/scripts/install-zscaler-cert.sh ${IS_LOCAL} ${TMO_PEM}
##### Zscaler End #####

RUN apk add --update python3 make g++ && \
    rm -rf /var/cache/apk/*






