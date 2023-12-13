FROM node:16-alpine3.15

RUN apk -v --update add \
        python3 \
        make \
        vips-dev \
        autoconf \
        automake \
        libtool \
        nasm \
        g++ \
        gcc \
        py-pip \
        groff \
        less \
        wget \
        npm \
        mailcap \
        && \
    pip install --upgrade awscli==1.31.13 s3cmd==2.0.1 python-magic six dateutils && \
    apk -v --purge del py-pip

ENV NODE_ENV production

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]