#!/bin/bash

# Deploy Script para "Quem Mente Menos?"
# Automatiza o processo de deployment com validações defensivas

set -euo pipefail  # Exit on error, undefined variables, pipe failures
IFS=$'\n\t'       # Set Internal Field Separator

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FLUTTER_DIR="$PROJECT_ROOT/flutter"
TERRAFORM_DIR="$PROJECT_ROOT/terraform"

# Environment (production, staging, development)
ENVIRONMENT="${1:-staging}"
SKIP_TESTS="${2:-false}"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
    fi
    
    # Check Flutter
    if ! command -v flutter &> /dev/null; then
        log_error "Flutter is not installed"
    fi
    
    # Check Azure CLI
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed"
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_warn "Terraform is not installed (skipping infrastructure deployment)"
    fi
    
    log_info "Prerequisites check passed ✓"
}

validate_environment() {
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging|development)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT. Must be production, staging, or development"
    fi
    
    log_info "Deploying to: $ENVIRONMENT"
}

run_tests() {
    if [ "$SKIP_TESTS" == "true" ]; then
        log_warn "Skipping tests (not recommended for production)"
        return
    fi
    
    log_info "Running backend tests..."
    cd "$BACKEND_DIR"
    npm test || log_error "Backend tests failed"
    
    log_info "Running Flutter tests..."
    cd "$FLUTTER_DIR"
    flutter test || log_error "Flutter tests failed"
    
    log_info "All tests passed ✓"
}

build_backend() {
    log_info "Building backend..."
    cd "$BACKEND_DIR"
    
    # Clean previous builds
    rm -rf dist
    
    # Install production dependencies
    npm ci --production
    
    # Build TypeScript
    npm run build
    
    # Create deployment package
    zip -r ../backend-$ENVIRONMENT.zip . \
        -x "*.git*" \
        -x "*test*" \
        -x "*.env.example" \
        -x "*.md" \
        -x "node_modules/.cache/*"
    
    log_info "Backend build complete ✓"
}

build_flutter() {
    log_info "Building Flutter apps..."
    cd "$FLUTTER_DIR"
    
    # Clean previous builds
    flutter clean
    
    # Get dependencies
    flutter pub get
    
    # Build Android
    log_info "Building Android APK..."
    flutter build apk --release --dart-define=ENV=$ENVIRONMENT
    
    # Build iOS (only on macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        log_info "Building iOS..."
        flutter build ios --release --no-codesign --dart-define=ENV=$ENVIRONMENT
    else
        log_warn "Skipping iOS build (not on macOS)"
    fi
    
    log_info "Flutter build complete ✓"
}

deploy_infrastructure() {
    if ! command -v terraform &> /dev/null; then
        log_warn "Skipping infrastructure deployment (Terraform not installed)"
        return
    fi
    
    log_info "Deploying infrastructure..."
    cd "$TERRAFORM_DIR"
    
    # Initialize Terraform
    terraform init
    
    # Select workspace
    terraform workspace select $ENVIRONMENT || terraform workspace new $ENVIRONMENT
    
    # Plan deployment
    terraform plan -var="environment=$ENVIRONMENT" -out=tfplan
    
    # Apply if not in dry-run mode
    if [ "$DRY_RUN" != "true" ]; then
        terraform apply tfplan
    else
        log_warn "Dry run mode - skipping terraform apply"
    fi
    
    log_info "Infrastructure deployment complete ✓"
}

deploy_backend() {
    log_info "Deploying backend to Azure Functions..."
    
    # Get function app name based on environment
    FUNCTION_APP_NAME="func-quem-mente-menos"
    if [ "$ENVIRONMENT" != "production" ]; then
        FUNCTION_APP_NAME="$FUNCTION_APP_NAME-$ENVIRONMENT"
    fi
    
    # Deploy using Azure CLI
    az functionapp deployment source config-zip \
        --resource-group "rg-quem-mente-menos-$ENVIRONMENT" \
        --name "$FUNCTION_APP_NAME" \
        --src "$PROJECT_ROOT/backend-$ENVIRONMENT.zip"
    
    log_info "Backend deployment complete ✓"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Get function app URL
    FUNCTION_APP_NAME="func-quem-mente-menos"
    if [ "$ENVIRONMENT" != "production" ]; then
        FUNCTION_APP_NAME="$FUNCTION_APP_NAME-$ENVIRONMENT"
    fi
    
    APP_URL="https://$FUNCTION_APP_NAME.azurewebsites.net/api/health"
    
    # Wait for app to be ready
    log_info "Waiting for app to be ready..."
    sleep 30
    
    # Check health endpoint
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
    
    if [ "$HTTP_CODE" == "200" ]; then
        log_info "Deployment verified successfully ✓"
    else
        log_error "Deployment verification failed. HTTP code: $HTTP_CODE"
    fi
}

cleanup() {
    log_info "Cleaning up..."
    rm -f "$PROJECT_ROOT/backend-$ENVIRONMENT.zip"
    rm -f "$TERRAFORM_DIR/tfplan"
    log_info "Cleanup complete ✓"
}

# Main execution
main() {
    log_info "Starting deployment process..."
    
    check_prerequisites
    validate_environment
    run_tests
    build_backend
    build_flutter
    deploy_infrastructure
    deploy_backend
    verify_deployment
    cleanup
    
    log_info "🎉 Deployment completed successfully!"
    log_info "Environment: $ENVIRONMENT"
    log_info "Timestamp: $(date)"
}

# Run main function
main
