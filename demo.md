# Demo: Docker and Kubernetes Setup

This document provides a fast, repeatable demo setup for running the Linker backend with Docker or Kubernetes. It assumes you are in the repo root.

## Docker (Local)

### Prereqs
- Docker Desktop or Docker Engine

### 1) Ensure the image is available
```bash
docker pull blessedsoft/devops-app-backend:latest
```

### 2) Start Postgres
```bash
docker network create linker-net


```bash
docker run -d --name linker-db --network linker-net --env-file .env -p 5432:5432 postgres:16-alpine

### 3) Run database migrations
```bash
docker run --rm --name linker-api --network linker-net --env-file .env -p 3001:3000 blessedsoft/devops-app-backend:latest npx prisma migrate deploy

docker run --rm --name linker-api --network linker-net --env-file .env -p 3001:3000 blessedsoft/devops-app-backend:latest npx prisma migrate deploy


### 4) Start the API
```bash
docker run --rm --name linker-api --network linker-net --env-file .env -p 3001:3000 blessedsoft/devops-app-backend:latest
```

The API will be available at `http://localhost:3001/api`.

## Kubernetes (Cluster Server)

### Prereqs
- A local cluster like `kind` or `minikube`
- `kubectl`

### 1) Make sure the cluster can pull the image
The cluster nodes must be able to pull `blessedsoft/devops-app-backend:latest`.
If it is in a private registry, create an image pull secret and attach it to the default service account (or the deployment).

### 2) Create secrets
```bash
kubectl create namespace linker

kubectl create secret generic linker-secrets -n linker \
  --from-literal=DATABASE_URL="postgresql://postgres:Passw0rd@linker-db:5432/linker?schema=public" \
  --from-literal=FRONTEND_ORIGIN="http://localhost:3000" \
  --from-literal=CLOUDINARY_CLOUD_NAME="changeme" \
  --from-literal=CLOUDINARY_API_KEY="changeme" \
  --from-literal=CLOUDINARY_API_SECRET="changeme"

kubectl create secret generic linker-db-secrets -n linker \
  --from-literal=POSTGRES_USER="postgres" \
  --from-literal=POSTGRES_PASSWORD="Passw0rd" \
  --from-literal=POSTGRES_DB="linker"
```

### 3) Apply demo manifests
```bash
@'
apiVersion: v1
kind: Service
metadata:
  name: linker-db
  namespace: linker
spec:
  selector:
    app: linker-db
  ports:
    - port: 5432
      targetPort: 5432
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: linker-db
  namespace: linker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: linker-db
  template:
    metadata:
      labels:
        app: linker-db
    spec:
      containers:
        - name: postgres
          image: postgres:16
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: linker-db-secrets
---
apiVersion: v1
kind: Service
metadata:
  name: linker-api
  namespace: linker
spec:
  selector:
    app: linker-api
  ports:
    - port: 3001
      targetPort: 3000
  type: ClusterIP
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: linker-api
  namespace: linker
spec:
  replicas: 1
  selector:
    matchLabels:
      app: linker-api
  template:
    metadata:
      labels:
        app: linker-api
    spec:
      initContainers:
        - name: prisma-migrate
          image: blessedsoft/devops-app-backend:latest
          command: ["npx", "prisma", "migrate", "deploy"]
          envFrom:
            - secretRef:
                name: linker-secrets
      containers:
        - name: api
          image: blessedsoft/devops-app-backend:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: linker-secrets
          env:
            - name: PORT
              value: "3000"
'@ | kubectl apply -f -
```

### 4) Access the API
For a quick local demo, port-forward the service:
```bash
kubectl -n linker port-forward svc/linker-api 3001:3001
```

Then browse `http://localhost:3001/api`.
