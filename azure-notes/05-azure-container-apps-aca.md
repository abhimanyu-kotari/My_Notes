Source Timeframe: 04:29:35 to 04:38:00

# Module 05: Azure Container Apps (ACA)

## 1. What is Azure Container Apps (ACA)?
In modern software engineering, businesses build applications out of multiple microservices—such as an API backend, a frontend website, background workers, and payment processors. 

While **Azure Container Instances (ACI)** is fantastic for running a single isolated container task, it lacks built-in autoscaling based on HTTP web traffic, ingress routing, microservice discovery, and traffic splitting between application versions. On the other end of the spectrum, **Azure Kubernetes Service (AKS)** gives you infinite power, but requires you to manage complex Kubernetes clusters, node pools, networking overlays, and steep learning curves.

**Azure Container Apps (ACA)** is the "sweet spot" (the Goldilocks container service in Azure). It is a **fully managed serverless container platform** built directly on top of enterprise-grade Kubernetes, Envoy proxy, KEDA (Kubernetes Event-driven Autoscaling), and Dapr (Distributed Application Runtime)—**without exposing any Kubernetes complexity to you**.

| Azure Service | Primary Architectural Focus | Best Used For | Management Complexity |
| :--- | :--- | :--- | :---: |
| **ACI (Container Instances)** | Single isolated container jobs | Quick scripts, batch ETL processing, single container runners | Low (Fastest start) |
| **ACA (Container Apps)** | Serverless microservices platform | Multi-service web APIs, event-driven workers, zero-to-N scaling | Medium (Recommended for microservices) |
| **AKS (Kubernetes Service)** | Full enterprise container orchestration | Complex multi-tier architectures requiring raw Kubernetes APIs and custom CRDs | High (Requires dedicated DevOps management) |

---

## 2. Real-World Analogy: The Food Truck Festival
- **Virtual Machine (VM):** You buy an entire restaurant building. You must pay rent, electricity, maintenance, and insurance 24/7, even when no customers visit.
- **ACI (Container Instance):** You rent a single hot dog cart for an afternoon event. When the event ends, you pack it up and stop paying. Simple, but it only sells hot dogs.
- **ACA (Container Apps):** A modern, managed **Food Truck Festival**. The festival park provides shared power, water, restrooms, and a front gate security entrance (Container Apps Environment). You park your specialized food trucks (Burger Truck, Taco Truck, Ice Cream Truck). If a huge crowd rushes the Taco Truck, the festival automatically allows two more Taco Trucks to pull up instantly. When the crowd leaves at midnight, the trucks pack up and your cost drops to **zero**!

---

## 3. Core Architecture of Azure Container Apps

```
[ Public HTTPS Internet Traffic ]
                │
                ▼
  [ Built-in Envoy Ingress Proxy ]  ──> Auto SSL Termination & Traffic Splitting
         │                    │
         │ (80% Traffic)      │ (20% Canary Traffic)
         ▼                    ▼
  [ Revision 1 (v1.0) ]  [ Revision 2 (v2.0) ]
     (Stable Web Pods)      (New Release Test)
         │
         ▼  (Internal Service-to-Service Ingress)
  [ Backend Order API ]  <───  [ KEDA Queue Event Scaler ]
```

### Key Building Blocks:
1. **Container Apps Environment:**
   - The security boundary wrapping your container apps.
   - All apps inside the same environment share the same virtual network (VNet), Log Analytics workspace, and Dapr configuration.
2. **Revisions (Version Snapshots):**
   - Every time you change your container's configuration or deploy a new Docker image tag, Azure creates an immutable **Revision** (e.g., `myapp--rev1`, `myapp--rev2`).
   - Multiple revisions can run simultaneously, enabling seamless zero-downtime deployments.
3. **Traffic Splitting (Canary & Blue-Green Deployments):**
   - You can split incoming web traffic across revisions without needing an external load balancer.
   - Example: Route 90% of user traffic to your stable version (`v1.0`) and 10% to your new beta version (`v2.0`) to verify stability before full rollout.
4. **Ingress (External vs. Internal):**
   - **External Ingress:** Exposes an HTTPS endpoint to the public internet with automatic TLS/SSL certificates managed by Microsoft.
   - **Internal Ingress:** Restricts communication so only other apps within the same ACA Environment can communicate with the service (ideal for databases, private microservices, and queue listeners).

---

## 4. Serverless Autoscaling with KEDA

One of ACA's superpower features is **scaling to zero**:
- **Scale to Zero ($0 Cost when Idle):** Traditional VMs cost money every second they are turned on. If your application receives zero requests between 2:00 AM and 6:00 AM, ACA shuts down all running container replicas. You pay **$0** for compute during that idle window.
- **Automatic Scale Out:** When the first HTTP request hits the Envoy ingress in the morning, ACA wakes up a container replica in milliseconds and serves the traffic.
- **KEDA Scalers Supported:**
  - **HTTP Traffic:** Scale based on concurrent HTTP requests (e.g., 1 new replica per 50 concurrent requests).
  - **CPU & Memory:** Scale when CPU utilization exceeds 75%.
  - **Cloud Queues & Event Streams:** Scale based on queue length in Azure Storage Queue, Azure Service Bus, RabbitMQ, or Apache Kafka.

---

## 5. Essential Azure CLI Commands for ACA

### Step 1: Install or Update Container Apps CLI Extension
```bash
az extension add --name containerapp --upgrade
az provider register --namespace Microsoft.App
az provider register --namespace Microsoft.OperationalInsights
```

### Step 2: Create a Resource Group and Log Analytics Workspace
```bash
az group create --name my-rg --location eastus

az monitor log-analytics workspace create \
  --resource-group my-rg \
  --workspace-name my-aca-logs
```

### Step 3: Create the Container Apps Environment
```bash
az containerapp env create \
  --name my-aca-env \
  --resource-group my-rg \
  --location eastus
```

### Step 4: Deploy a Public Microservice Container App
```bash
az containerapp create \
  --name my-web-app \
  --resource-group my-rg \
  --environment my-aca-env \
  --image mcr.microsoft.com/azuredocs/aci-helloworld:latest \
  --target-port 80 \
  --ingress external \
  --query properties.configuration.ingress.fqdn
```

### Step 5: Configure Traffic Splitting (Canary Deployment)
```bash
az containerapp ingress traffic set \
  --name my-web-app \
  --resource-group my-rg \
  --revision-weight my-web-app--v1=80 my-web-app--v2=20
```

---

## Summary Checklist

- [ ] I can describe the difference between **ACI**, **ACA**, and **AKS** and when to choose each.
- [ ] I understand what an **Azure Container Apps Environment** is and how it serves as a secure VNet boundary.
- [ ] I understand **Revisions** and how they allow Canary and Blue-Green traffic splitting.
- [ ] I know the difference between **External Ingress** (public facing) and **Internal Ingress** (private microservices).
- [ ] I understand how **KEDA-driven autoscaling** allows ACA to scale all the way down to **0 replicas**, reducing compute costs to zero during idle periods.