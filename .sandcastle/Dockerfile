FROM node:26-bookworm

ENV CI=true

RUN apt-get update && apt-get install -y \
  git \
  curl \
  jq \
  && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
  | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
  | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && apt-get update && apt-get install -y gh \
  && rm -rf /var/lib/apt/lists/*

ARG AGENT_UID=1000
ARG AGENT_GID=1000

RUN groupmod -o -g $AGENT_GID node && usermod -o -u $AGENT_UID -g $AGENT_GID -d /home/agent -m -l agent node

RUN npm install -g pnpm@latest
RUN npm install -g opencode-ai@latest

COPY linear /usr/local/bin/linear
RUN chmod +x /usr/local/bin/linear

USER ${AGENT_UID}:${AGENT_GID}

WORKDIR /home/agent

RUN mkdir -p /home/agent/.local/share/pnpm/store /home/agent/.cache/pnpm

RUN git config --global user.name "RALPH (Sandcastle)" && git config --global user.email "ralph@sandcastle.local"

ENTRYPOINT ["sleep", "infinity"]
