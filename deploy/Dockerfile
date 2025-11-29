FROM node:24-alpine

# Install dependencies
RUN apk add --no-cache \
        python3 \
        py3-pip \
        py3-virtualenv \
        make \
        vips-dev \
        autoconf \
        automake \
        libtool \
        nasm \
        g++ \
        gcc \
        groff \
        less \
        wget \
        mailcap

# Create virtual environment for Python tools
RUN python3 -m venv /venv && \
    /venv/bin/pip install --upgrade pip && \
    /venv/bin/pip install \
        awscli==1.31.13 \
        s3cmd==2.0.1 \
        python-magic \
        dateutils

# Add venv to PATH so aws, s3cmd, etc. are available globally
ENV PATH="/venv/bin:$PATH"
ENV NODE_ENV=production

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
