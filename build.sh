#!/usr/bin/env bash

set -euo pipefail
set +H

# Colours
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

APP_NAME=${APP_NAME:-"ordering-frontend"}
NAMESPACE=${NAMESPACE:-"food-delivery"}
ENV_SECRET_NAME=${ENV_SECRET_NAME:-"ordering-frontend-secrets"}
DEPLOY=${DEPLOY:-true}
SETUP_DATABASES=${SETUP_DATABASES:-false}

REGISTRY_SERVER=${REGISTRY_SERVER:-docker.io}
REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE:-codevertex}
IMAGE_REPO="${REGISTRY_SERVER}/${REGISTRY_NAMESPACE}/${APP_NAME}"

DEVOPS_REPO=${DEVOPS_REPO:-"Bengo-Hub/devops-k8s"}
DEVOPS_DIR=${DEVOPS_DIR:-"$HOME/devops-k8s"}
VALUES_FILE_PATH=${VALUES_FILE_PATH:-"apps/${APP_NAME}/values.yaml"}

GIT_EMAIL=${GIT_EMAIL:-"dev@bengobox.com"}
GIT_USER=${GIT_USER:-"Ordering Bot"}
TRIVY_ECODE=${TRIVY_ECODE:-0}

if [[ -z ${GITHUB_SHA:-} ]]; then
  GIT_COMMIT_ID=$(git rev-parse --short=8 HEAD || echo "localbuild")
else
  GIT_COMMIT_ID=${GITHUB_SHA::8}
fi

log_info "Service : ${APP_NAME}"
log_info "Namespace: ${NAMESPACE}"
log_info "Image   : ${IMAGE_REPO}:${GIT_COMMIT_ID}"

command -v git >/dev/null || { log_error "git is required"; exit 1; }
command -v docker >/dev/null || { log_error "docker is required"; exit 1; }
command -v trivy >/dev/null || { log_error "trivy is required"; exit 1; }
if [[ ${DEPLOY} == "true" ]]; then
  for tool in kubectl helm yq jq; do
    command -v "$tool" >/dev/null || { log_error "$tool is required"; exit 1; }
  done
fi

log_success "Prerequisite checks passed"

# =============================================================================
# Auto-sync secrets from devops-k8s
# =============================================================================
if [[ ${DEPLOY} == "true" ]]; then
  log_info "Checking and syncing required secrets from devops-k8s..."
  SYNC_SCRIPT=$(mktemp)
  if curl -fsSL https://raw.githubusercontent.com/Bengo-Hub/devops-k8s/main/scripts/tools/check-and-sync-secrets.sh -o "$SYNC_SCRIPT" 2>/dev/null; then
    source "$SYNC_SCRIPT"
    check_and_sync_secrets "REGISTRY_USERNAME" "REGISTRY_PASSWORD" "GH_PAT" || log_warn "Secret sync failed - continuing with existing secrets"
    rm -f "$SYNC_SCRIPT"
  else
    log_warn "Unable to download secret sync script - continuing with existing secrets"
  fi
fi

log_info "Running Trivy scan"
trivy fs . --exit-code "$TRIVY_ECODE" --format table || true

log_info "Building Docker image (with production API URLs for Next.js build-time env)"
# NPM_TOKEN is passed as a BuildKit secret (not ARG) to avoid leaking it into image layers.
# NEXT_PUBLIC_* are baked at build time; without these the app would call localhost and cause CORS/network errors in production.
export NPM_TOKEN="${GH_PAT:-${NPM_TOKEN:-}}"
DOCKER_BUILDKIT=1 docker build . -t "${IMAGE_REPO}:${GIT_COMMIT_ID}" \
  --secret id=NPM_TOKEN,env=NPM_TOKEN \
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://orderingapi.codevertexitsolutions.com/api/v1}" \
  --build-arg NEXT_PUBLIC_SSO_URL="${NEXT_PUBLIC_SSO_URL:-https://sso.codevertexitsolutions.com}" \
  --build-arg NEXT_PUBLIC_CAFE_WEBSITE_URL="${NEXT_PUBLIC_CAFE_WEBSITE_URL:-https://theurbanloftcafe.com}" \
  --build-arg NEXT_PUBLIC_LOGISTICS_UI_URL="${NEXT_PUBLIC_LOGISTICS_UI_URL:-https://logistics.codevertexitsolutions.com}" \
  --build-arg NEXT_PUBLIC_NOTIFICATIONS_API_URL="${NEXT_PUBLIC_NOTIFICATIONS_API_URL:-https://notificationsapi.codevertexitsolutions.com}" \
  --build-arg NEXT_PUBLIC_TREASURY_API_URL="${NEXT_PUBLIC_TREASURY_API_URL:-https://booksapi.codevertexitsolutions.com}"
log_success "Docker build complete"

if [[ ${DEPLOY} != "true" ]]; then
  log_warn "DEPLOY=false -> skipping publish & deploy"
  exit 0
fi

if [[ -n ${REGISTRY_USERNAME:-} && -n ${REGISTRY_PASSWORD:-} ]]; then
  echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_SERVER" -u "$REGISTRY_USERNAME" --password-stdin
fi

docker push "${IMAGE_REPO}:${GIT_COMMIT_ID}"
log_success "Image pushed"

if [[ -n ${KUBE_CONFIG:-} ]]; then
  mkdir -p ~/.kube
  echo "$KUBE_CONFIG" | base64 -d > ~/.kube/config
  chmod 600 ~/.kube/config
  export KUBECONFIG=~/.kube/config
fi

kubectl get ns "$NAMESPACE" >/dev/null 2>&1 || kubectl create ns "$NAMESPACE"

if [[ -z ${CI:-}${GITHUB_ACTIONS:-} && -f KubeSecrets/devENV.yml ]]; then
  log_info "Applying local dev secrets"
  kubectl apply -n "$NAMESPACE" -f KubeSecrets/devENV.yml || log_warn "Failed to apply devENV.yml"
fi

if [[ -n ${REGISTRY_USERNAME:-} && -n ${REGISTRY_PASSWORD:-} ]]; then
  kubectl -n "$NAMESPACE" create secret docker-registry registry-credentials \
    --docker-server="$REGISTRY_SERVER" \
    --docker-username="$REGISTRY_USERNAME" \
    --docker-password="$REGISTRY_PASSWORD" \
    --dry-run=client -o yaml | kubectl apply -f - || log_warn "registry secret creation failed"
fi

# Ensure env secret exists (values expect ordering-frontend-secrets with mapboxToken, sentryDsn)
if ! kubectl -n "$NAMESPACE" get secret "$ENV_SECRET_NAME" >/dev/null 2>&1; then
  log_warn "Secret $ENV_SECRET_NAME not found - creating placeholder"
  kubectl -n "$NAMESPACE" create secret generic "$ENV_SECRET_NAME" \
    --from-literal=mapboxToken="${MAPBOX_TOKEN:-}" \
    --from-literal=sentryDsn="${SENTRY_DSN:-}" \
    --dry-run=client -o yaml | kubectl apply -f - || true
fi

# Clone devops-k8s repo (needed for helm values update)
if [[ ! -d "$DEVOPS_DIR" ]]; then
  TOKEN="${GH_PAT:-}"
  CLONE_URL="https://github.com/${DEVOPS_REPO}.git"
  [[ -n $TOKEN ]] && CLONE_URL="https://x-access-token:${TOKEN}@github.com/${DEVOPS_REPO}.git"
  git clone "$CLONE_URL" "$DEVOPS_DIR" || log_warn "Unable to clone devops repo for helm values update"
fi

# Update Helm values using centralized script (prefer DEVOPS_DIR from clone)
[[ -d "$DEVOPS_DIR" ]] || DEVOPS_DIR="$HOME/devops-k8s"
source "${DEVOPS_DIR}/scripts/helm/update-values.sh" 2>/dev/null || {
  log_warn "Centralized helm update script not available"
}
if declare -f update_helm_values >/dev/null 2>&1; then
  update_helm_values "$APP_NAME" "$GIT_COMMIT_ID" "$IMAGE_REPO"
else
  log_warn "update_helm_values function not available - helm values not updated"
fi

log_success "Deployment pipeline complete for ${APP_NAME}"
