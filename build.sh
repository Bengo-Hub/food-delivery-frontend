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

APP_NAME=${APP_NAME:-"food-delivery-frontend"}
NAMESPACE=${NAMESPACE:-"food-delivery"}
ENV_SECRET_NAME=${ENV_SECRET_NAME:-"food-delivery-frontend-env"}
DEPLOY=${DEPLOY:-true}
SETUP_DATABASES=${SETUP_DATABASES:-false}

REGISTRY_SERVER=${REGISTRY_SERVER:-docker.io}
REGISTRY_NAMESPACE=${REGISTRY_NAMESPACE:-codevertex}
IMAGE_REPO="${REGISTRY_SERVER}/${REGISTRY_NAMESPACE}/${APP_NAME}"

DEVOPS_REPO=${DEVOPS_REPO:-"Bengo-Hub/devops-k8s"}
DEVOPS_DIR=${DEVOPS_DIR:-"$HOME/devops-k8s"}
VALUES_FILE_PATH=${VALUES_FILE_PATH:-"apps/${APP_NAME}/values.yaml"}

GIT_EMAIL=${GIT_EMAIL:-"dev@bengobox.com"}
GIT_USER=${GIT_USER:-"Food Delivery Bot"}
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

log_info "Running Trivy scan"
trivy fs . --exit-code "$TRIVY_ECODE" --format table || true

log_info "Building Docker image"
DOCKER_BUILDKIT=1 docker build . -t "${IMAGE_REPO}:${GIT_COMMIT_ID}"
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

# Ensure basic env secret exists
if ! kubectl -n "$NAMESPACE" get secret "$ENV_SECRET_NAME" >/dev/null 2>&1; then
  log_warn "Secret $ENV_SECRET_NAME not found - creating placeholder"
  kubectl -n "$NAMESPACE" create secret generic "$ENV_SECRET_NAME" \
    --from-literal=NEXT_PUBLIC_API_URL="https://fooddeliveryapi.codevertexitsolutions.com" \
    --from-literal=NEXT_PUBLIC_NOTIFICATIONS_URL="https://notificationsapi.codevertexitsolutions.com" \
    --from-literal=MAPBOX_TOKEN="set-me" \
    --from-literal=SENTRY_DSN="" || true
fi

TOKEN="${GH_PAT:-${GIT_SECRET:-${GITHUB_TOKEN:-}}}"
CLONE_URL="https://github.com/${DEVOPS_REPO}.git"
[[ -n $TOKEN ]] && CLONE_URL="https://x-access-token:${TOKEN}@github.com/${DEVOPS_REPO}.git"

if [[ ! -d $DEVOPS_DIR ]]; then
  git clone "$CLONE_URL" "$DEVOPS_DIR" || { log_warn "Unable to clone devops repo"; DEVOPS_DIR=""; }
fi

if [[ -n $DEVOPS_DIR && -d $DEVOPS_DIR ]]; then
  pushd "$DEVOPS_DIR" >/dev/null || true
  git config user.email "$GIT_EMAIL"
  git config user.name "$GIT_USER"
  git fetch origin main || true
  git checkout main || git checkout -b main || true
  if [[ -f "$VALUES_FILE_PATH" ]]; then
    IMAGE_REPO_ENV="$IMAGE_REPO" IMAGE_TAG_ENV="$GIT_COMMIT_ID" \
      yq e -i '.image.repository = strenv(IMAGE_REPO_ENV) | .image.tag = strenv(IMAGE_TAG_ENV)' "$VALUES_FILE_PATH"
    git add "$VALUES_FILE_PATH"
    git commit -m "${APP_NAME}:${GIT_COMMIT_ID} released" || true
    [[ -n $TOKEN ]] && git push origin HEAD:main || log_warn "Skipped pushing values (no token)"
  else
    log_warn "${VALUES_FILE_PATH} not found in devops repo"
  fi
  popd >/dev/null || true
fi

log_info "Deployment summary"
echo "  Image : ${IMAGE_REPO}:${GIT_COMMIT_ID}"
echo "  Namespace: ${NAMESPACE}"
echo "  Deploy   : ${DEPLOY}"
