#!/bin/sh
set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define paths
PRISMA_DIR="/app/prisma"
PRISMA_TEMPLATE_DIR="/app/prisma-template"
DB_FILE="$PRISMA_DIR/db.sqlite"
LOCAL_DB_DIR="/app/local-db"

echo "${GREEN}=== Easy Dataset Database Initialization ===${NC}"

# Create prisma directory if it doesn't exist
if [ ! -d "$PRISMA_DIR" ]; then
    echo "${YELLOW}Creating prisma directory...${NC}"
    mkdir -p "$PRISMA_DIR"
fi

# Check if database file exists
if [ ! -f "$DB_FILE" ]; then
    echo "${YELLOW}Database file not found at: $DB_FILE${NC}"

    # Check if local-db has files (possible configuration issue)
    if [ -d "$LOCAL_DB_DIR" ] && [ -n "$(ls -A $LOCAL_DB_DIR 2>/dev/null | grep -v 'empty.txt')" ]; then
        echo "${YELLOW}Note: local-db contains files but database is missing.${NC}"
        echo "${YELLOW}If you have existing data, ensure prisma volume is mounted.${NC}"
    fi

    # Initialize database from template
    echo "${GREEN}Initializing database from template...${NC}"

    if [ -d "$PRISMA_TEMPLATE_DIR" ]; then
        # Copy only db.sqlite from template (preserve existing schema.prisma, migrations, etc.)
        if [ -f "$PRISMA_TEMPLATE_DIR/db.sqlite" ]; then
            cp "$PRISMA_TEMPLATE_DIR/db.sqlite" "$PRISMA_DIR/"
            echo "${GREEN}Database initialized from template!${NC}"
        else
            echo "${YELLOW}Template db.sqlite not found. Running prisma db push...${NC}"
            cd /app
            pnpm prisma db push --accept-data-loss
            echo "${GREEN}Database created successfully!${NC}"
        fi
    else
        echo "${YELLOW}No template found. Running prisma db push...${NC}"
        cd /app
        pnpm prisma db push --accept-data-loss
        echo "${GREEN}Database created successfully!${NC}"
    fi
else
    echo "${GREEN}Database file exists: $DB_FILE${NC}"
fi

echo "${GREEN}=== Database Ready! Starting application... ===${NC}"
echo ""

# Execute the command passed to the container
exec "$@"
