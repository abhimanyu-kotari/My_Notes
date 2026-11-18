Source Timeframe: 04:23:35 to 04:29:29

# Module 04: Azure Container Instances (ACI) — Theory & Concepts

## 1. What is Azure Container Instances (ACI)?

**Azure Container Instances (ACI)** is Microsoft Azure's pure serverless container runtime. It is the fastest way to run a Docker container in the cloud — you provide an image, specify CPU and RAM requirements, and Azure runs the container within seconds, with zero infrastructure management.

**Traditional approach (before ACI):** Create VM → wait 3–5 min → SSH in → install Docker → pull image → configure NSG rules → run container → keep paying 24/7 even when idle.

**With ACI:** Provide image + CPU + RAM + port → ACI provisions everything in ~10 seconds → container is live with a public FQDN → pay only while running → delete with one command.

---

## 2. Serverless Execution Theory — What "Serverless" Actually Means

**Serverless does not mean "no servers exist."** Servers exist — you simply do not *own, manage, patch, or provision* them. Microsoft's Azure infrastructure maintains a large pool of bare-metal servers. When you request an ACI container, Azure's control plane allocates resources from this shared pool on-demand, runs your container, and returns the resources to the pool when done.

> **Core Value Proposition:** You declare *what* you want to run (a container image), not *where* it should run (a specific server). Azure's orchestration handles placement, scheduling, health monitoring, and restart logic.

### Cold Start vs. Subsequent Runs

| Scenario | What Happens | Typical Time |
| :--- | :--- | :--- |
| **Cold Start** | No pre-warmed container. Azure must pull image (if not cached), allocate resources, launch process from scratch. | 5–15 seconds |
| **Subsequent Runs** | Image cached in the region. Resource allocation pre-warmed. | 2–5 seconds |

*ACI cold starts are measured in seconds (not milliseconds like a simple function), because launching a full container process is heavier than a function invocation.*

---

## 3. ACI vs. ACA vs. AKS — Choosing the Right Container Service

| Dimension | ACI | ACA | AKS |
| :--- | :--- | :--- | :--- |
| **Abstraction Level** | Single container / container group | Managed microservices platform | Full Kubernetes cluster |
| **Autoscaling** | None built-in | KEDA event-driven (HTTP, queues) | HPA + KEDA + cluster autoscaler |
| **Networking** | Direct public IP / FQDN | Built-in Envoy ingress + TLS | Custom ingress controllers |
| **Best For** | Batch jobs, CI/CD runners, quick tests | Modern microservices, event-driven apps | Complex enterprise distributed systems |
| **Complexity** | Low | Medium | High |

---

## 4. Container Groups — ACI's Fundamental Resource Unit

The top-level deployable unit in ACI is a **Container Group** — analogous to a **Pod** in Kubernetes.

```
Container Group: "web-and-sidecar"
  ├── Container 1: nginx (port 80)
  │     - Communicates with Container 2 via localhost:9090
  └── Container 2: log-forwarder (port 9090)
        - Reads nginx logs from shared volume
        - Ships to Azure Monitor

Shared Resources:
  ✓ Same lifecycle    (start/stop/restart together)
  ✓ Same localhost    (containers talk via 127.0.0.1)
  ✓ Same storage volumes (mounted to both)
  ✗ NOT shared: CPU/RAM (each has own allocation)
```

**The Sidecar Pattern:** A main application container paired with a helper container handling cross-cutting concerns (logging, monitoring, config refresh) without modifying the main container's code.

---

## 5. Restart Policies — Matching Container Lifecycle to Workload

| Policy | Restart Trigger | Ideal Use Case |
| :--- | :--- | :--- |
| **Always** *(default)* | Restarts on crash OR successful exit | Long-running web services, HTTP APIs, background queue listeners |
| **OnFailure** | Restarts only when exit code is non-zero (error) | ETL batch jobs, database backup routines, scheduled data transformations |
| **Never** | Runs exactly once — never restarted | One-time migration scripts, CI/CD build agents, database seeding tasks |

> **Billing warning:** If you run a data processing script with `--restart-policy Always`, ACI restarts it in a loop after each completion — costing money indefinitely. Always use `Never` or `OnFailure` for one-shot tasks.

---

## 6. Per-Second Billing — The Economics of Serverless Containers

ACI uses **per-second billing** measured against allocated vCPU cores and GiB of memory.

**Real Cost Example** (nightly ETL script: 1 vCPU + 1.5 GiB RAM, runs 8 minutes):

```
vCPU cost:    1 core × 480 sec × ~$0.0000012 = $0.000576
Memory cost:  1.5 GiB × 480 sec × ~$0.0000013 = $0.000936
─────────────────────────────────────────────────────
Total: ~$0.0015 per nightly job run

Compare: B1s VM running 24/7 = ~$7.59/month
         30 nightly ACI jobs  = ~$0.045/month
         Savings: 99.4%
```

Billing starts when the container group enters "Running" state and stops immediately on deletion or task completion (for `Never` restart policy).

---

## 7. Hands-On: Deploying ACI via Azure CLI

```bash
# 1. Create Resource Group
az group create --name RG-ContainerDemo --location eastus

# 2. Deploy container with public DNS label
az container create \
  --resource-group RG-ContainerDemo \
  --name my-first-aci \
  --image mcr.microsoft.com/azuredocs/aci-helloworld \
  --dns-name-label myunique-student-demo \
  --ports 80 \
  --cpu 1 \
  --memory 1.5 \
  --restart-policy Never

# 3. Get status and public URL
az container show \
  --resource-group RG-ContainerDemo \
  --name my-first-aci \
  --query "{Status:instanceView.state, URL:ipAddress.fqdn}" \
  --output table

# 4. View logs
az container logs --resource-group RG-ContainerDemo --name my-first-aci

# 5. Delete (billing stops)
az container delete --resource-group RG-ContainerDemo --name my-first-aci --yes
```

---

## Summary Checklist

- [ ] I understand that **ACI is serverless** — Azure manages all infrastructure; I only provide the container image.
- [ ] I know what a **cold start** is and why ACI has 5–15 second cold starts (image pull + resource allocation).
- [ ] I can choose between **ACI** (isolated batch jobs), **ACA** (microservices + autoscaling), and **AKS** (full Kubernetes control).
- [ ] I know the 3 **Restart Policies**: Always (web services), OnFailure (batch jobs), Never (one-shot tasks).
- [ ] I understand **Container Groups** as pods — containers sharing lifecycle, localhost, and volumes.
- [ ] I understand how **per-second billing** makes ACI dramatically cheaper than VMs for short-lived workloads.
