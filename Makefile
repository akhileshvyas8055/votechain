.PHONY: setup dev build test deploy-contracts deploy-backend clean logs \
       shell-backend shell-db migrate seed help

# ─── Default target ─────────────────────────────
help: ## Show this help
	@echo "VoteChain EVM - Available Commands"
	@echo "═══════════════════════════════════"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ─── Setup ──────────────────────────────────────
setup: ## Initial project setup
	@echo "📦 Installing dependencies..."
	pnpm install
	@echo "📋 Copying environment files..."
	@test -f .env || cp .env.example .env
	@test -f packages/contracts/.env || cp packages/contracts/.env.example packages/contracts/.env
	@echo "🐳 Starting infrastructure services..."
	docker compose up -d postgres redis ipfs
	@echo "⏳ Waiting for database to be ready..."
	@sleep 5
	@echo "🗃️  Running database migrations..."
	pnpm db:migrate
	@echo "🌱 Seeding database..."
	pnpm db:seed
	@echo "✅ Setup complete! Run 'make dev' to start development."

# ─── Development ────────────────────────────────
dev: ## Start all services in development mode
	@echo "🐳 Starting infrastructure..."
	docker compose up -d postgres redis ipfs
	@echo "🚀 Starting all packages in dev mode..."
	pnpm dev

dev-backend: ## Start only the backend
	docker compose up -d postgres redis
	pnpm backend:dev

dev-admin: ## Start only the admin portal
	pnpm admin:dev

dev-results: ## Start only the results portal
	pnpm results:dev

dev-evm: ## Start the EVM machine software
	pnpm evm:dev

# ─── Build ──────────────────────────────────────
build: ## Build all packages
	pnpm build

build-docker: ## Build all Docker images
	docker compose build

# ─── Testing ────────────────────────────────────
test: ## Run all tests
	pnpm test

test-contracts: ## Run smart contract tests
	pnpm contracts:test

test-backend: ## Run backend tests
	cd packages/backend && pnpm test

test-coverage: ## Run tests with coverage
	cd packages/contracts && pnpm hardhat coverage
	cd packages/backend && pnpm jest --coverage

# ─── Linting ────────────────────────────────────
lint: ## Lint all packages
	pnpm lint

lint-fix: ## Fix linting issues
	pnpm lint:fix

format: ## Format all files
	pnpm format

# ─── Deployment ─────────────────────────────────
deploy-contracts: ## Deploy smart contracts to network
	@echo "📜 Compiling contracts..."
	cd packages/contracts && pnpm hardhat compile
	@echo "🚀 Deploying contracts..."
	cd packages/contracts && pnpm hardhat run scripts/deploy.ts --network polygon_mumbai
	@echo "✅ Contracts deployed!"

deploy-contracts-mainnet: ## Deploy contracts to Polygon mainnet (PRODUCTION)
	@echo "⚠️  DEPLOYING TO MAINNET - Are you sure? (Ctrl+C to cancel)"
	@sleep 5
	cd packages/contracts && pnpm hardhat run scripts/deploy.ts --network polygon_mainnet

verify-contracts: ## Verify contracts on Polygonscan
	cd packages/contracts && pnpm hardhat run scripts/verify.ts --network polygon_mumbai

deploy-backend: ## Deploy backend to production
	@echo "🐳 Building backend Docker image..."
	docker build -f infrastructure/docker/backend.Dockerfile -t votechain-backend:latest .
	@echo "📤 Pushing to registry..."
	docker push votechain-backend:latest
	@echo "✅ Backend deployed!"

deploy-all: deploy-contracts deploy-backend ## Deploy everything

# ─── Database ───────────────────────────────────
migrate: ## Run database migrations
	pnpm db:migrate

migrate-reset: ## Reset database (DESTRUCTIVE)
	cd packages/backend && pnpm prisma migrate reset --force

seed: ## Seed the database
	pnpm db:seed

studio: ## Open Prisma Studio
	pnpm db:studio

# ─── Infrastructure ────────────────────────────
infra-up: ## Start all infrastructure services
	docker compose up -d postgres redis ipfs prometheus grafana

infra-down: ## Stop all infrastructure services
	docker compose down

infra-reset: ## Reset all infrastructure (DESTRUCTIVE)
	docker compose down -v
	@echo "⚠️  All data volumes have been removed!"

# ─── Docker ─────────────────────────────────────
up: ## Start all Docker services
	docker compose up -d

down: ## Stop all Docker services
	docker compose down

restart: ## Restart all Docker services
	docker compose restart

# ─── Logs ───────────────────────────────────────
logs: ## View all service logs
	docker compose logs -f

logs-backend: ## View backend logs
	docker compose logs -f backend

logs-db: ## View database logs
	docker compose logs -f postgres

# ─── Shell Access ───────────────────────────────
shell-backend: ## Shell into backend container
	docker compose exec backend sh

shell-db: ## Shell into database container
	docker compose exec postgres psql -U votechain -d votechain_db

shell-redis: ## Shell into Redis container
	docker compose exec redis redis-cli

# ─── Cleanup ────────────────────────────────────
clean: ## Clean all build artifacts
	pnpm clean
	rm -rf node_modules
	rm -rf packages/*/node_modules
	rm -rf packages/contracts/artifacts
	rm -rf packages/contracts/cache
	rm -rf packages/contracts/typechain-types
	rm -rf packages/backend/dist
	rm -rf packages/admin-portal/.next
	rm -rf packages/results-portal/.next
	@echo "🧹 Clean complete!"

clean-all: clean infra-reset ## Clean everything including Docker volumes
	@echo "🧹 Full clean complete!"
