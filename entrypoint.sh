#!/bin/bash
# NativX INFINITY - Entrypoint Script
# Waits for PostgreSQL and starts the FastAPI server

set -e

echo "=========================================="
echo "  NativX INFINITY - Starting Up"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    log "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
    
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if python3 -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(
        host=os.environ.get('POSTGRES_HOST', 'db'),
        port=int(os.environ.get('POSTGRES_PORT', 5432)),
        user=os.environ.get('POSTGRES_USER', 'NativX'),
        password=os.environ.get('POSTGRES_PASSWORD', 'NativX_secret_2024'),
        dbname=os.environ.get('POSTGRES_DB', 'NativX')
    )
    conn.close()
    exit(0)
except Exception as e:
    print(f'Connection failed: {e}')
    exit(1)
" 2>/dev/null; then
            log "${GREEN}PostgreSQL is ready!${NC}"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log "${YELLOW}PostgreSQL not ready yet... (attempt $RETRY_COUNT/$MAX_RETRIES)${NC}"
        sleep 2
    done
    
    log "${RED}Failed to connect to PostgreSQL after $MAX_RETRIES attempts${NC}"
    return 1
}

# Wait for Redis to be ready
wait_for_redis() {
    log "${YELLOW}Waiting for Redis to be ready...${NC}"
    
    MAX_RETRIES=15
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if python3 -c "
import redis
try:
    r = redis.Redis(host='redis', port=6379, db=0)
    r.ping()
    exit(0)
except Exception as e:
    print(f'Redis failed: {e}')
    exit(1)
" 2>/dev/null; then
            log "${GREEN}Redis is ready!${NC}"
            return 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log "${YELLOW}Redis not ready yet... (attempt $RETRY_COUNT/$MAX_RETRIES)${NC}"
        sleep 2
    done
    
    log "${RED}Failed to connect to Redis after $MAX_RETRIES attempts${NC}"
    return 1
}

# Initialize database
init_database() {
    log "${YELLOW}Initializing database...${NC}"
    
    python3 -c "
from backend.database import engine, Base
from backend.models import User, Project
Base.metadata.create_all(bind=engine)
print('Database tables created successfully!')
"
    
    log "${GREEN}Database initialized!${NC}"
}

# Verify keystore exists
check_keystore() {
    if [ -f "/app/release.jks" ]; then
        log "${GREEN}Release keystore found at /app/release.jks${NC}"
    else
        log "${YELLOW}Generating release keystore...${NC}"
        keytool -genkey -v \
            -keystore /app/release.jks \
            -keyalg RSA \
            -keysize 2048 \
            -validity 10000 \
            -alias NativX \
            -storepass NativX123 \
            -keypass NativX123 \
            -dname "CN=NativX, OU=SaaS, O=NativX, L=Tech, S=Ca, C=US"
        log "${GREEN}Keystore generated!${NC}"
    fi
}

# Create necessary directories
setup_directories() {
    log "${YELLOW}Setting up directories...${NC}"
    mkdir -p /app/downloads /app/builds /app/logs
    chmod 755 /app/downloads /app/builds /app/logs
    log "${GREEN}Directories ready!${NC}"
}

# Main execution
main() {
    setup_directories
    check_keystore
    wait_for_postgres
    wait_for_redis
    init_database
    
    log "${GREEN}=========================================="
    log "  NativX INFINITY - All Systems GO!"
    log "==========================================${NC}"
    
    # Start the FastAPI server
    log "${GREEN}Starting FastAPI server on port 8000...${NC}"
    exec uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 2
}

main "$@"
