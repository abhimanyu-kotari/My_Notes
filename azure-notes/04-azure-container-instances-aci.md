Source Timeframe: 04:23:35 to 04:29:29

# Module 04: Azure Container Instances (ACI)

## 1. What is Azure Container Instances (ACI)?
**Azure Container Instances (ACI)** is Microsoft Azure's pure **Serverless Container** offering. It provides the fastest and simplest way to run a container in the cloud without having to provision, configure, patch, or manage any underlying Virtual Machines, clusters, or orchestrators.

In traditional computing:
- If you wanted to run a Docker container, you first had to create an Azure Virtual Machine, wait 3 minutes for it to boot, install Docker via SSH, pull your image, and configure firewall ports.
- With **ACI**, you skip the virtual machine entirely! You simply point Azure to a Docker image (from Docker Hub or Azure Container Registry), specify how much CPU and RAM you need, and Azure spins up your container in seconds.

### How ACI Works (Serverless Container Execution)

| Configuration Parameter | Value Example | How ACI Handles It |
| :--- | :--- | :--- |
| **Container Image** | `mcr.microsoft.com/azuredocs/aci-helloworld` | Pulls directly from Docker Hub, Microsoft Container Registry (MCR), or private ACR. |
| **Compute Sizing** | `1 vCPU, 1.5 GiB RAM` | Billed strictly per-second of execution time based on allocated CPU/memory. |
| **Networking & DNS** | `my-cloud-app.eastus.azurecontainer.io` | Directly provisions a public IP address and custom FQDN subdomain. |
| **Port Exposure** | `Port 80 (TCP)` | Automatically opens inbound traffic without configuring complex NSGs or load balancers. |
| **Infrastructure Overhead**| *Zero Virtual Machines or Nodes* | Azure executes your container directly on the hypervisor fabric in under 10 seconds. |

---

## 2. When to Use ACI vs. AKS vs. ACA
Azure provides multiple container hosting platforms. Choosing the right one depends on your architectural needs:

| Requirement | Best Service | Why? |
| :--- | :--- | :--- |
| **Simple isolated tasks, fast batch scripts, CI/CD runners, quick prototypes** | **Azure Container Instances (ACI)** | Lowest friction, starts in seconds, exact per-second billing, zero cluster maintenance. |
| **Modern microservices, event-driven scaling, scale-to-zero, traffic splitting** | **Azure Container Apps (ACA)** | Built-in ingress, KEDA event scaling, automatic HTTPS, microservice communication without managing Kubernetes. |
| **Massive enterprise distributed systems, custom network topologies, full control** | **Azure Kubernetes Service (AKS)** | Full Kubernetes cluster API, fine-grained node pool control, service mesh, Helm charts. |

---

## 3. Container Groups in ACI
The top-level resource in ACI is a **Container Group**.
- A Container Group is a collection of one or more containers that are scheduled on the same host machine.
- Containers within a container group share:
  - The same lifecycle (started, stopped, and restarted together).
  - The same local network (they can communicate with each other over `localhost`).
  - The same storage volumes (if mounted).
- *This concept is directly analogous to a **Pod** in Kubernetes.*

---

## 4. Restart Policies: Matching Container Behavior to Your Task
When creating a container in ACI, you specify a **Restart Policy**:

| Restart Policy | Behavior & Trigger Condition | Ideal Production Use Case |
| :--- | :--- | :--- |
| **Always** *(Default)* | If the container crashes or finishes execution, ACI restarts it automatically. | Long-running web applications, HTTP APIs, and background queue listeners. |
| **OnFailure** | Restarts only if the container process fails (process exits with a non-zero exit code). | Scheduled data transformation jobs, ETL batch scripts, and database backup routines. |
| **Never** | Runs the process container exactly once to completion and never restarts it. | One-time migration scripts, database seeding tasks, and CI/CD build agents. |

---

## 5. Hands-On: Deploying ACI via Azure CLI

You can spin up a fully accessible, public web application with a single command:

```bash
# 1. Create a Resource Group
az group create --name RG-ContainerDemo --location eastus

# 2. Deploy a public container with a custom DNS name
az container create \
  --resource-group RG-ContainerDemo \
  --name my-first-aci \
  --image mcr.microsoft.com/azuredocs/aci-helloworld \
  --dns-name-label myunique-student-demo \
  --ports 80 \
  --cpu 1 \
  --memory 1.5

# 3. Check the deployment state and get the public FQDN URL
az container show \
  --resource-group RG-ContainerDemo \
  --name my-first-aci \
  --query "{Status:instanceView.state, FQDN:ipAddress.fqdn, IP:ipAddress.ip}" \
  --output table
```

Once deployed, you can immediately open your browser and navigate to:
`http://myunique-student-demo.eastus.azurecontainer.io`

---

## 6. Inspecting Logs and Managing the Container

```bash
# View real-time console/application logs from inside the container
az container logs --resource-group RG-ContainerDemo --name my-first-aci

# Attach an interactive terminal inside the running container
az container exec --resource-group RG-ContainerDemo --name my-first-aci --exec-command "/bin/sh"

# Stop the container to halt billing
az container stop --resource-group RG-ContainerDemo --name my-first-aci

# Delete the container completely
az container delete --resource-group RG-ContainerDemo --name my-first-aci --yes
```

---

## 7. Per-Second Billing Economics
ACI features hyper-granular **per-second billing**:
- You are billed strictly for the number of vCPUs and gigabytes of memory your container group requested, measured to the nearest second.
- **Example:** If you run a data transformation script that takes 45 seconds to process a batch of CSV files and then exits with a `Never` restart policy, **you only pay for 45 seconds of compute!**
- There is zero idle compute cost. When the container finishes execution, billing stops immediately.

---

## Summary Checklist

- [ ] I understand that **Azure Container Instances (ACI)** is a pure serverless container service requiring zero VM or cluster management.
- [ ] I know when to choose **ACI** (quick single tasks, batch jobs) over **AKS** (complex distributed orchestrations).
- [ ] I understand the 3 **Restart Policies**: `Always` (web services), `OnFailure` (batch scripts), and `Never` (one-shot tasks).
- [ ] I can deploy a container using `az container create` with `--dns-name-label` and `--ports`.
- [ ] I know how to view live logs using `az container logs`.
- [ ] I understand how **per-second billing** saves money for short-lived cloud jobs.
