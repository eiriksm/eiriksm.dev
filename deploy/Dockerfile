FROM alpine:3.9

RUN apk -v --update add \
        python \
        py-pip \
        groff \
        less \
        wget \
        npm \
        mailcap \
        && \
    pip install --upgrade awscli==1.14.5 s3cmd==2.0.1 python-magic && \
    apk -v --purge del py-pip

ENV NODE_ENV production

ADD entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]