Source Timeframe: 00:51:42 to 01:44:43

# Module 02: Compute (Azure Virtual Machines)

## 1. Introduction to Azure Compute & Virtual Machines
In Microsoft Azure, **Compute** refers to any service that provides CPU processing power, RAM memory, and execution capacity for your applications. The foundational, most widely utilized IaaS compute offering is the **Azure Virtual Machine (VM)**.

An Azure Virtual Machine gives you complete administrative control over a virtualized operating system (Windows or Linux) running inside Microsoft's enterprise datacenters.

```
+--------------------------------------------------------------+
|               AZURE VIRTUAL MACHINE ANATOMY                  |
|                                                              |
|   +------------------------------------------------------+   |
|   |         Operating System (Ubuntu Linux / Windows)    |   |
|   |         Applications, Services, Runtime, Docker      |   |
|   +------------------------------------------------------+   |
|            │                          │                      |
|      [ vCPU / RAM ]            [ Storage Disks ]             |
|   Selected VM Size/SKU     • OS Disk (e.g. 30GB SSD)         |
|   (e.g., Standard_B1s)     • Data Disks (Optional)           |
|            │               • Temporary Disk (Ephemeral)      |
|            │                          │                      |
|   +------------------------------------------------------+   |
|   |               NETWORK INTERFACE CARD (NIC)           |   |
|   |   Private IP (VNet/Subnet)  |  Public IP (Internet)  |   |
|   |               Network Security Group (NSG)           |   |
|   +------------------------------------------------------+   |
+--------------------------------------------------------------+
```

---

## 2. Choosing VM Sizes & Series (SKUs)
Azure offers specialized VM families tailored for distinct computational workloads:

| Series | Category | Description | Best Suited For |
| :--- | :--- | :--- | :--- |
| **B-Series** | Burstable | Low-cost VMs that accrue compute credits during idle times and burst to 100% CPU when traffic spikes. | **Student labs, dev/test environments, small web servers.** |
| **D-Series** | General Purpose | Balanced ratio of vCPU to memory (typically 4GB RAM per vCPU). | Enterprise web apps, medium databases, microservices. |
| **F-Series** | Compute Optimized | High CPU-to-memory ratio; fast processing clock speeds. | Batch processing, analytics, web servers, code compilation. |
| **E-Series** | Memory Optimized | High memory-to-CPU ratio (e.g., 8GB+ RAM per vCPU). | In-memory caches (Redis), relational databases (SQL, SAP HANA). |
| **N-Series** | GPU Accelerated | Powered by NVIDIA GPUs for heavy parallel compute. | Deep Learning training, AI model inference, video rendering. |

> **Student Pro-Tip:** When practicing in Azure, choose **`Standard_B1s`** (1 vCPU, 1 GB RAM) or **`Standard_B2s`** (2 vCPU, 4 GB RAM). These are eligible under the Azure free tier and avoid burning through your trial credits!

---

## 3. Azure VM Storage Disks Explained
Every Virtual Machine is created with at least two disks:
1. **OS Disk:** Stores the operating system image, boot sectors, and system files. Automatically assigned drive letter `C:` in Windows or `/dev/sda` in Linux.
2. **Temporary / Ephemeral Disk:** Labeled `D:` in Windows or `/dev/sdb` mounted at `/mnt` in Linux.
   - *CRITICAL WARNING:* This disk sits on the physical host machine. **Data stored on the temporary disk is completely wiped when the VM is stopped, deallocated, or rebooted.** Store only pagefiles, swap space, or temporary scratch buffers here!
3. **Data Disks (Optional):** Additional managed disks attached to the VM for databases, media files, and application logs.

### Managed Disk Storage Tiers:
- **Standard HDD:** Magnetic rotational platters. Lowest cost, high latency. Good for backups.
- **Standard SSD:** Entry-level solid-state storage. Balanced, consistent performance for light web dev.
- **Premium SSD (v1 & v2):** High IOPS, sub-millisecond latency. Essential for production databases.
- **Ultra Disk:** Extreme performance (up to 400,000 IOPS) for mission-critical enterprise workloads.

---

## 4. Virtual Networking & Network Security Groups (NSGs)

```
        Internet Traffic (Users / SSH Clients)
                          │
                          ▼
            [ Network Security Group (NSG) ]
             Rule 100: Allow SSH (Port 22)   ──> ALLOWED
             Rule 200: Allow HTTP (Port 80)  ──> ALLOWED
             Rule 65500: Deny All Inbound    ──> BLOCKED
                          │
                          ▼
             [ Network Interface (NIC) ]
              ├── Public IP (e.g. 20.198.42.15)
              └── Private IP (e.g. 10.0.1.4)
                          │
                          ▼
             [ Virtual Machine (Ubuntu) ]
```

### What is a Network Security Group (NSG)?
An **NSG** acts as a virtual firewall that controls inbound and outbound network traffic to your VM network interface (NIC) or entire subnet.

### Rules & Priority Hierarchy:
- Every rule has a **Priority Number** between **100 and 4096**.
- **Rules are evaluated strictly in order of lowest priority number to highest.** As soon as traffic matches a rule, evaluation stops!
- **Default Deny Inbound Rule (Priority 65500):** By default, Azure automatically blocks **all** incoming traffic from the public Internet unless you explicitly create an Allow rule with a lower priority number!

### Essential Port Numbers:
- **Port 22 (SSH):** Secure Shell connection for Linux VMs.
- **Port 3389 (RDP):** Remote Desktop Protocol for Windows VMs.
- **Port 80 (HTTP):** Standard unencrypted web traffic.
- **Port 443 (HTTPS):** Encrypted, secure web traffic.

---

## 5. Step-by-Step Hands-On: Provisioning a Linux Virtual Machine

### Via Azure Portal:
1. Search for **Virtual Machines** in the top search bar and click **Create → Azure virtual machine**.
2. **Project Details:**
   - Select your Subscription.
   - Resource Group: Create new, e.g., `RG-Azure-ZeroToHero`.
3. **Instance Details:**
   - Virtual machine name: `vm-web-dev`.
   - Region: Select nearest region (e.g., `Central India` or `East US`).
   - Availability options: `No infrastructure redundancy required` (for learning/testing).
   - Security type: `Standard`.
   - Image: `Ubuntu Server 22.04 LTS - x64 Gen2`.
   - Size: `Standard_B1s` (1 vCPU, 1 GiB memory).
4. **Administrator Account:**
   - Authentication type: Select **SSH public key**.
   - Username: `azureuser`.
   - Key pair name: `vm-web-dev_key`.
   - Click **Download private key and create resource** (saves `.pem` file to your computer).
5. **Inbound Port Rules:**
   - Allow selected ports: Check **SSH (22)** and **HTTP (80)**.
6. Click **Review + Create**, then click **Create**.

---

## 6. Connecting to Your Virtual Machine

### Connecting to a Linux VM via SSH:
Open your command terminal (PowerShell, Bash, or Command Prompt):

```bash
# 1. Navigate to the folder containing your downloaded private key
cd ~/Downloads

# 2. On Linux / Mac, restrict file permissions (mandatory for SSH)
chmod 400 vm-web-dev_key.pem

# 3. Connect using the SSH client
ssh -i vm-web-dev_key.pem azureuser@<YOUR_PUBLIC_IP_ADDRESS>
```

### Connecting to a Windows VM via RDP:
1. On the VM Overview page in Azure Portal, click **Connect → RDP**.
2. Click **Download RDP File**.
3. Open the `.rdp` file on your computer (launches Remote Desktop Connection).
4. Enter the username and password you configured during creation.

---

## 7. Deploying a Live Web Server on Your VM
Once connected to your Ubuntu VM via SSH, run the following commands to install and launch an **Nginx** web server:

```bash
# Update package repositories
sudo apt update -y

# Install Nginx web server
sudo apt install nginx -y

# Verify Nginx status is active (running)
sudo systemctl status nginx

# Create a custom landing page
echo "<h1>Welcome to My Azure Zero to Hero Cloud Server!</h1><p>Deployed with precision on Ubuntu Linux.</p>" | sudo tee /var/www/html/index.html
```

Now, open any web browser and paste your VM's public IP address: `http://<YOUR_PUBLIC_IP_ADDRESS>`. Your custom web page will render immediately!

---

## 8. The VM Lifecycle & The Hidden "Billing Trap"

Understanding VM states is crucial to avoid unwanted cloud charges:

```
+---------------+     Start      +---------------+
|    Stopped    | -------------> |    Running    |
| (Deallocated) | <------------- | (Full Billing)|
+---------------+   Stop (Portal)+---------------+
                           ▲             │
                           │   Shutdown  │ (OS command)
                           │             ▼
                         +-----------------+
                         |     Stopped     |
                         | (Compute Billed)|
                         +-----------------+
```

### The Three States:
1. **Running:** VM is powered on. CPU, RAM, and storage are fully active. **Full billing applies.**
2. **Stopped (Allocated):** If you run `sudo poweroff` from *inside* the Linux terminal, the OS shuts down, but the physical server rack in Azure **still holds and reserves your CPU and RAM**. **You are STILL billed for compute!**
3. **Stopped (Deallocated):** When you click **Stop** from the **Azure Portal web console** or execute `az vm deallocate`, Azure completely releases the CPU and RAM back to the shared pool.
   - **Compute (CPU/RAM) cost drops to strictly $0.00!**
   - You only pay a few pennies per month for the disk storage holding your files.

---

## Summary Checklist

- [ ] I understand the difference between General Purpose (`B-series`), Compute (`F-series`), and Memory (`E-series`) VM sizing.
- [ ] I know that the **Temporary Disk** (`D:` on Windows, `/mnt` on Linux) is wiped during host migration or restart.
- [ ] I can configure a **Network Security Group (NSG)** rule using priority numbers to open ports `22` (SSH) and `80` (HTTP).
- [ ] I can connect to a Linux VM from my terminal using an SSH private key (`.pem`).
- [ ] I have verified that an Nginx web server can be installed and served through port 80.
- [ ] I understand the critical financial difference between **Stopped** (still billed for compute) and **Stopped (Deallocated)** (compute cost is $0).
