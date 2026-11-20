FROM python:3.12-slim-trixie

RUN apt-get update \
 && apt-get install -y --no-install-recommends patch \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY ./rrcd .
# Upstream deltas we carry — see patches/README.md for what each one is and the
# condition that retires it. --fuzz=0 so a submodule bump that changes the
# context fails the build loudly instead of applying somewhere subtly wrong.
COPY ./patches ./patches
RUN set -e; for p in ./patches/*.patch; do [ -e "$p" ] || continue; echo "applying $p"; patch -p1 --fuzz=0 <"$p"; done \
 && pip install --no-cache-dir . \
 && cd / && rm -rf /build

COPY assets/rrc-hub-prepare.py /usr/local/bin/rrc-hub-prepare
RUN chmod +x /usr/local/bin/rrc-hub-prepare

# Reticulum and rrcd state both live on the data volume.
ENV HOME=/data \
    PYTHONUNBUFFERED=1 \
    LANG=C.UTF-8

WORKDIR /data
