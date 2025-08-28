# nginx base (Debian) so we can easily apt-install tooling
FROM nginx:stable

# Avoid tz dialogs
ENV DEBIAN_FRONTEND=noninteractive

# Install base deps + git + Node.js 20 LTS + Azure CLI + azd
RUN apt-get update && apt-get install -y \
    curl ca-certificates gnupg lsb-release unzip git bash sudo \
    apt-transport-https software-properties-common \
 && rm -rf /var/lib/apt/lists/*

# Node.js 20 (LTS)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get update && apt-get install -y nodejs \
 && rm -rf /var/lib/apt/lists/*

# Azure CLI
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash

# Azure Developer CLI (azd)
RUN curl -fsSL https://aka.ms/install-azd.sh | bash

# A working directory for cloning repos
RUN mkdir -p /workspace && chown -R www-data:www-data /workspace

# Copy our tiny Node API + startup script
WORKDIR /opt/provisioner
COPY app/package.json app/package-lock.json ./
RUN npm ci --omit=dev
COPY app/ ./app/
COPY start.sh /usr/local/bin/start.sh
COPY provision.sh /usr/local/bin/provision.sh
RUN chmod +x /usr/local/bin/start.sh /usr/local/bin/provision.sh

# Security: run as non-root where possible, but az/azd generally need elevated NET; we'll sudo just for az/azd if required
USER root

# API listens on 8080; nginx on 80
EXPOSE 80 8080

# Start both the Node API and nginx
CMD ["/usr/local/bin/start.sh"]
