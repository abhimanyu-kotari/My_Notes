Source Timeframe: 04:29:35 to 04:38:00

# Module 05: Azure Container Apps (ACA) — Architecture & Scaling Theory

## 1. What is Azure Container Apps (ACA)?

In modern cloud application engineering, software is built from multiple decoupled microservices — public web frontends, backend REST APIs, asynchronous background queue consumers, and scheduled background workers.

While **Azure Container Instances (ACI)** is ideal for running single isolated container tasks, it lacks built-in HTTP ingress routing, autoscaling based on incoming web traffic, microservice service discovery, and zero-downtime traffic splitting between application revisions. On the opposite end of the spectrum, **Azure Kubernetes Service (AKS)** provides complete orchestration control, but demands management of Kubernetes control planes, node pools, complex virtual network overlays, ingress controller CRDs, and cluster upgrades.

**Azure Container Apps (ACA)** is the "sweet spot" (the Goldilocks container platform). It is a **fully managed serverless container service** built on top of enterprise-grade Kubernetes, Envoy proxy, KEDA (Kubernetes Event-driven Autoscaling), and Dapr (Distributed Application Runtime) — completely abstracting cluster and control plane complexity from the developer.

| Platform | Underlying Infrastructure | Primary Architectural Focus | Management Overhead |
| :--- | :--- | :--- | :---: |
| **ACI (Container Instances)** | Hypervisor container fabric | Single isolated tasks & batch jobs | Lowest |
| **ACA (Container Apps)** | Managed Kubernetes + Envoy + KEDA + Dapr | Serverless microservices & event-driven APIs | Balanced / Low |
| **AKS (Kubernetes Service)** | Raw Kubernetes cluster (node pools) | Highly customized enterprise distributed systems | High (DevOps required) |

---

## 2. Real-World Analogy: The Food Truck Festival

To understand where ACA fits, consider this progression:
- **Virtual Machine (VM):** You lease an entire standalone brick-and-mortar restaurant building. You pay constant rent, power, and maintenance 24/7, even during hours when zero diners arrive.
- **Azure Container Instances (ACI):** You rent an individual hot dog cart for an afternoon event. When the event finishes, you pack it up and billing ceases immediately. It is simple, but operates in total isolation and only serves a single menu item.
- **Azure Container Apps (ACA):** A fully managed **Food Truck Festival**. The festival grounds provide common power lines, water, restrooms, and a secure front gate with security guards (**Container Apps Environment**). You park multiple specialized food trucks (Burger Truck, Taco Truck, Beverage Truck). When a sudden lunch rush hits the Taco Truck, the festival organizer instantly permits three identical Taco Trucks to pull up. When evening arrives and the crowd departs, all trucks shut down and operational expense drops to **$0.00**.

---

## 3. Core Architecture of Azure Container Apps

```
[ Public HTTPS Internet Traffic ]
                │
                ▼
  [ Built-in Envoy Ingress Proxy ]  ──► Auto SSL Termination & Traffic Splitting
         │                    │
         │ (80% Traffic)      │ (20% Canary Traffic)
         ▼                    ▼
  [ Revision 1 (v1.0) ]  [ Revision 2 (v2.0) ]
     (Stable Web Pods)      (New Release Test)
         │
         ▼  (Internal Service-to-Service Ingress)
  [ Backend Order API ]  ◄───  [ KEDA Queue Event Scaler ]
```

### The 4 Foundational Building Blocks:
1. **Container Apps Environment:**
   - The boundary encompassing a set of container apps.
   - All apps inside an environment share the same Virtual Network (VNet), Log Analytics workspace, and Dapr pub/sub configuration.
2. **Revisions (Version Snapshots):**
   - Every time configuration changes or a new container image tag is deployed, ACA creates an immutable **Revision** (e.g., `app--rev1`, `app--rev2`).
   - Multiple revisions can execute concurrently, enabling zero-downtime deployment patterns.
3. **Traffic Splitting (Canary & Blue-Green Releases):**
   - Inbound HTTP traffic can be apportioned between active revisions via simple percentage weights (e.g., 90% stable, 10% canary) without requiring external load balancers.
4. **Ingress (External vs. Internal):**
   - **External Ingress:** Exposes a public HTTPS domain with automatic Microsoft-managed TLS certificates.
   - **Internal Ingress:** Restricts communication strictly to services residing within the identical Container Apps Environment (ideal for databases, internal microservices, and queue processors).

---

## 4. Serverless Autoscaling with KEDA (Kubernetes Event-Driven Autoscaler)

Traditional VM horizontal scaling is slow (minutes to boot) and typically reacts only to average CPU or memory usage. KEDA enables ACA to scale reactively based on real external events and metrics:

### The Mechanism of Scaling to Zero:
- **Idle State ($0 Cost):** When zero HTTP requests or queue messages are queued, ACA scales replicas down to **0**. No underlying compute charges accrue.
- **Scale Out Trigger:** When a request hits the Envoy proxy or a message enters a monitored message queue, KEDA activates and spins up container replicas in seconds to drain the queue or serve the HTTP requests.

### Supported KEDA Scalers:
- **HTTP Traffic:** Scales on concurrent HTTP request thresholds (e.g., 1 replica per 50 concurrent connections).
- **Azure Storage Queues & Service Bus:** Scales on queue message backlog count.
- **Apache Kafka / Azure Event Hubs:** Scales on consumer group lag.
- **CPU & Memory Metrics:** Scales when resource saturation crosses defined percentages (e.g., > 75%).

---

## 5. Revisions and Safe Deployment Strategies

### Blue-Green Deployments:
1. Revision 1 (Blue) serves 100% of production traffic.
2. Revision 2 (Green) is deployed and verified via internal testing endpoints.
3. Traffic weight is instantly shifted from 100% Blue to 100% Green with zero dropped requests.
4. If issues occur, roll back immediately by shifting 100% back to Blue.

### Canary Deployments:
1. Deploy new Revision 2 alongside stable Revision 1.
2. Route 10% of real production traffic to Revision 2, retaining 90% on Revision 1.
3. Monitor application telemetry, error rates, and latency for anomalies.
4. Incrementally adjust traffic (80/20 → 50/50 → 0/100) until the rollout is 100% complete.

---

## 6. Practical CLI Reference: Azure Container Apps

```bash
# 1. Install & configure Container Apps CLI extension
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights

# 2. Create Resource Group & Log Analytics Workspace
az group create --name RG-AppsDemo --location eastus
az monitor log-analytics workspace create \
  --resource-group RG-AppsDemo \
  --workspace-name law-apps-demo

# 3. Create the Container Apps Environment
az containerapp env create \
  --name env-microservices \
  --resource-group RG-AppsDemo \
  --location eastus

# 4. Deploy a container app with external ingress and scale-to-zero enabled
az containerapp create \
  --name api-service \
  --resource-group RG-AppsDemo \
  --environment env-microservices \
  --image mcr.microsoft.com/azuredocs/aci-helloworld:latest \
  --target-port 80 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 10

# 5. Split traffic across revisions (Canary: 80% v1, 20% v2)
az containerapp ingress traffic set \
  --name api-service \
  --resource-group RG-AppsDemo \
  --revision-weight api-service--v1=80 api-service--v2=20
```

---

## Summary Checklist

- [ ] I can explain why **ACA** sits between ACI and AKS, leveraging Kubernetes, Envoy, KEDA, and Dapr.
- [ ] I understand what a **Container Apps Environment** represents (shared VNet and security perimeter).
- [ ] I know how **Revisions** enable zero-downtime Blue-Green and Canary traffic splitting.
- [ ] I understand the difference between **External Ingress** and **Internal Ingress**.
- [ ] I can describe how **KEDA** enables event-driven scaling down to **0 replicas** during idle periods to eliminate unnecessary compute spend.
