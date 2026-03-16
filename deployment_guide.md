# 🚀 NativX Deployment Guide

This guide describes how to deploy the NativX platform to a production VPS (e.g., DigitalOcean, AWS, Hetzner).

## 1. Prerequisites

- A standard Linux VPS (Ubuntu 22.04 LTS recommended)
- A domain name pointing to your VPS IP (e.g., `nativx.app`)
- Git and Docker installed

### Install Docker
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

## 2. SSL Certificates (Certbot)

Before starting Nginx, generate SSL certificates. We use the standalone method initially.

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot

# Stop any running web server on port 80
docker stop $(docker ps -q)

# Generate Certificate
sudo certbot certonly --standalone -d nativx.app -d www.nativx.app
```
*Note the path of the certificates (usually `/etc/letsencrypt/live/nativx.app/...`).*

## 3. Project Setup

Clone your repository to the VPS:
```bash
git clone https://github.com/your-username/nativx-platform.git /opt/nativx
cd /opt/nativx
```

### Production Configuration
1. **Environment Variables**:
   Copy the example file and fill in your real keys.
   ```bash
   cp .env.production.example .env
   nano .env
   ```
   *Make sure `APP_ENV=production` is set!*

2. **Nginx Config**:
   Replace the default config with the production one.
   ```bash
   cp nginx/nginx.prod.conf nginx/nginx.conf
   ```

## 4. Launch with Docker Compose

Start the entire stack in detached mode:
```bash
docker compose up -d --build
```

Verify everything is running:
```bash
docker compose ps
# Check logs if needed
docker compose logs -f
```

## 5. Stripe Webhook Configuration

1. Go to **Stripe Dashboard > Developers > Webhooks**.
2. Add Endpoint: `https://nativx.app/api/webhooks/stripe`
3. Select events: `checkout.session.completed`.
4. Copy the **Signing Secret** (`whsec_...`).
5. Update your `.env` on the VPS with `STRIPE_WEBHOOK_SECRET=whsec_...`
6. Restart the backend container:
   ```bash
   docker compose restart web
   ```

## 6. Maintenance

**Renew SSL:**
```bash
# Automate this via cron
docker stop NativX_nginx
sudo certbot renew
docker start NativX_nginx
```

**Update Application:**
```bash
git pull
docker compose up -d --build --no-deps web frontend worker
```
