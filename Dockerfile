# NativX INFINITY - Production Dockerfile
# Android SDK + Python + Build Tools

FROM mobiledevops/android-sdk-image:latest

LABEL maintainer="NativX INFINITY"
LABEL description="SaaS App Factory - Android & iOS Build System"

# Install system dependencies
USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    zip \
    unzip \
    libmagic1 \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Install Gradle 8.5
ENV GRADLE_VERSION=8.5
ENV GRADLE_HOME=/opt/gradle
RUN wget -q https://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip -O /tmp/gradle.zip \
    && unzip -q /tmp/gradle.zip -d /opt \
    && mv /opt/gradle-${GRADLE_VERSION} ${GRADLE_HOME} \
    && rm /tmp/gradle.zip \
    && ln -s ${GRADLE_HOME}/bin/gradle /usr/local/bin/gradle

# Set Python aliases
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy requirements first for layer caching
COPY requirements.txt /app/requirements.txt

# Install Python dependencies
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

# Generate Release Keystore (CRITICAL for Play Store builds)
RUN keytool -genkey -v \
    -keystore /app/release.jks \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -alias NativX \
    -storepass NativX123 \
    -keypass NativX123 \
    -dname "CN=NativX, OU=SaaS, O=NativX, L=Tech, S=Ca, C=US"

# Create necessary directories
RUN mkdir -p /app/downloads /app/builds /app/logs

# Copy application code
COPY . /app

# Set permissions
RUN chmod +x /app/entrypoint.sh 2>/dev/null || true

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONPATH=/app
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools"

# Expose port
EXPOSE 8000

# Default command (can be overridden by docker-compose)
CMD ["/bin/bash", "/app/entrypoint.sh"]
