Source Timeframe: 00:51:42 to 01:44:43

# Module 02: Compute (Azure Virtual Machines)

## 1. Introduction: Personal Computer vs. Production Server
What is the fundamental difference between your personal laptop and a production cloud server?
- **Personal Computer:** Used for individual daily tasks (browsing, writing documents, gaming). It is shut down when you sleep, connected to a domestic internet connection with dynamic IP addresses, and sits behind a consumer router.
- **Production Cloud Server:** Engineered to run 24 hours a day, 365 days a year without interruption. It is hosted inside hyper-secure physical datacenters with redundant diesel generators, enterprise cooling, multi-gigabit fiber connections, and static public IP addresses to serve millions of global requests simultaneously.

In Microsoft Azure, the foundational Infrastructure as a Service (IaaS) compute service is the **Azure Virtual Machine (VM)**.

### The Anatomy of an Azure Virtual Machine

| Component | Cloud Role & Purpose | Customer Responsibility |
| :--- | :--- | :--- |
| **vCPU & RAM (SKU / Size)** | Processing cores and working memory dynamically allocated from host hardware (e.g., `Standard_B1s`). | Choose the right size based on workload traffic and memory requirements. |
| **Operating System** | Base platform software (Ubuntu 22.04 LTS, Debian, Red Hat Enterprise Linux, Windows Server). | Maintain security updates, configure user accounts, and install runtimes. |
| **OS Disk (Managed SSD)** | Persistent drive holding the operating system, bootloader, and system libraries (typically 30 GB to 64 GB). | Azure persists this disk in redundant storage even when the VM is powered down. |
| **Temporary Disk (`/dev/sdb`)** | High-speed local SSD scratch disk physically attached to the host server for pagefile/swap. | **EPHEMERAL WARNING:** Formatted and wiped completely whenever the VM restarts or moves hosts! Never store databases here. |
| **Network Interface (NIC)** | Virtual network card connecting the VM to your private Virtual Network (VNet) and subnet. | Configure IP forwarding and private internal IP allocations. |
| **Public IP Address** | Routable internet IP address allowing external web traffic and SSH management. | Can be assigned as Dynamic (changes on stop) or Static (reserved). |
| **Network Security Group (NSG)**| Virtual stateful firewall controlling inbound and outbound port traffic. | Open required ports (e.g., Port 22 for SSH, Port 80 for HTTP, Port 443 for HTTPS). |

---

## 2. Choosing VM Sizes & Series (SKUs)
Azure offers hundreds of specialized VM sizes. Selecting the correct SKU ensures maximum cost efficiency:

| Series | Family Name | Best Used For | Free Tier Eligible? |
| :--- | :--- | :--- | :---: |
| **B-Series** | Burstable | Development, testing, low-traffic web servers, student practice, git runners. | ✅ Yes (`Standard_B1s`: 1 vCPU, 1 GiB RAM) |
| **D-Series** | General Purpose | Production web applications, mid-sized relational databases, microservices. | ❌ Pay-As-You-Go |
| **E-Series** | Memory Optimized | In-memory caching (Redis), large relational databases (SQL Server, SAP HANA). | ❌ Pay-As-You-Go |
| **F-Series** | Compute Optimized | Batch processing, analytics, video encoding, gaming server backends. | ❌ Pay-As-You-Go |
| **N-Series** | GPU Accelerated | Deep learning training, AI inference, 3D rendering, CUDA simulations. | ❌ Pay-As-You-Go |

---

## 3. Azure VM Storage Disks: The Ephemeral Disk Trap
When you deploy an Azure Virtual Machine, you get two distinct storage disks by default:
1. **The OS Disk (`sda`):**
   - Stored in Azure Managed Storage (remote redundant SSD/HDD).
   - Fully persistent: all installed packages, config files, and code survive reboots and host deallocations.
2. **The Temporary Disk (`sdb` - typically mounted at `/mnt`):**
   - Physically located on the actual host server blade in the datacenter rack for ultra-fast read/write latency.
   - **CRITICAL DATA LOSS WARNING:** Microsoft places a file named `DATALOSS_WARNING_README.txt` directly on this drive:
   > *"Any data stored on this drive will not be recovered during maintenance events, service healings, or resizing operations."*

---

## 4. Hands-on Walkthrough: Provisioning an Apache Web Server via Azure Portal

### Step 1: Portal Configuration Parameters
1. Navigate to **portal.azure.com** &rarr; Search **Virtual Machines** &rarr; Click **Create** &rarr; **Azure virtual machine**.
2. **Project Details:**
   - **Subscription:** Select your free trial or active subscription.
   - **Resource Group:** Create new &rarr; `azure-vm-rg` (every resource in Azure must live in a Resource Group).
3. **Instance Details:**
   - **Virtual Machine Name:** `my-web-server`
   - **Region:** Select the region closest to your target audience (e.g., `Central India` or `South Central India`).
   - **Availability Options:** Select **Availability Zone** &rarr; **Zone 1** (provides 99.99% uptime SLA).
   - **Security Type:** Standard.
   - **Image:** `Ubuntu Server 22.04 LTS - x64 Gen2`.
   - **Size:** `Standard_B1s` (1 vCPU, 1 GiB RAM - Free Tier eligible).
4. **Administrator Account:**
   - **Authentication Type:** Select **SSH public key**.
   - **Username:** `azureuser`
   - **SSH Public Key Source:** Select **Generate new key pair**.
   - **Key Pair Name:** `my-web-server_key`
5. **Inbound Port Rules:**
   - Public inbound ports: Select **Allow selected ports**.
   - Select: `SSH (22)` (leave HTTP closed for now to observe the real-world firewall behavior demonstrated in the course).

### Step 2: Automated Deployment via Custom Data (Cloud-Init)
Under the **Advanced** tab &rarr; scroll down to **Custom data and cloud-init** &rarr; paste the automated bash provisioning script:

```bash
#!/bin/bash
apt-get update -y
apt-get install -y apache2
systemctl start apache2
systemctl enable apache2
echo "<h1>Welcome to Apache Web Server on Azure</h1>" > /var/www/html/index.html
```

*What happens in the background?* When Azure finishes hardware allocation and boots the Ubuntu kernel for the first time, the `cloud-init` subsystem executes this script as `root`. It updates the package index, installs the Apache2 web server, enables the background daemon, and writes a custom landing page.

### Step 3: Review + Create and Download Private Key
1. Click **Review + create** &rarr; Azure runs validation checks.
2. Click **Create** &rarr; A modal popup will appear: **"Generate new key pair"**.
3. Click **Download private key and create resource**.
4. Save the file `my-web-server_key.pem` safely on your computer.

---

## 5. Connecting to the Virtual Machine: Two Methods

### Method A: In-Portal Browser Terminal (SSH using Azure CLI)
*Best for quick inspection without configuring local SSH clients or terminal permissions.*

1. In the Azure Portal, open your deployed Virtual Machine (`my-web-server`).
2. In the top navigation bar, click **Connect** &rarr; select **More ways to connect** &rarr; click **SSH using Azure CLI**.
3. Under the setup card, click **Configure + Check Access**.
   - Azure checks the VM running status, validates that port 22 is listening, checks network connectivity, and initiates the secure Cloud Shell proxy.
4. When all 4 status checks display a green checkmark, click **Connect**.
5. A command terminal drawer opens directly at the bottom of the Azure Portal.
6. When prompted: `Are you sure you want to continue connecting (yes/no/[fingerprint])?` &rarr; Type `yes` and press Enter.
7. Your terminal prompt appears: `azureuser@my-web-server:~$`.

### Method B: Connecting from Your Local Computer Terminal (macOS / Linux / WSL / Windows)
*Best for daily development, file editing, and direct SCP file transfers.*

#### On Linux / macOS / WSL:
```bash
# Step 1: Restrict permissions on private key (SSH will reject unprotected keys)
chmod 400 ~/Downloads/my-web-server_key.pem

# Step 2: Connect using SSH with public IP
ssh -i ~/Downloads/my-web-server_key.pem azureuser@<VM-PUBLIC-IP>
```

#### On Windows PowerShell (Fixing "Permissions are too open" error):
```powershell
# Step 1: Strip inherited permissions from file
icacls.exe .\my-web-server_key.pem /inheritance:r

# Step 2: Grant read permission strictly to current Windows user
icacls.exe .\my-web-server_key.pem /grant:r "$($env:USERNAME):(R)"

# Step 3: Connect cleanly
ssh -i .\my-web-server_key.pem azureuser@<VM-PUBLIC-IP>
```

---

## 6. Verifying Apache2 Inside the Virtual Machine
Once connected to the VM terminal, verify that the custom data script executed successfully:

```bash
# 1. Check Apache service status (must say "active (running)")
systemctl status apache2

# 2. Inspect the custom HTML document created by the bootstrap script
cat /var/www/html/index.html

# 3. Test HTTP web server response locally inside the server
curl http://localhost
```

**Expected Local Output:**
```html
<h1>Welcome to Apache Web Server on Azure</h1>
```

---

## 7. The Network Security Group (NSG) Port 80 Trap & Resolution

### The Problem:
1. In the Azure Portal, copy the **Public IP address** of your VM (e.g., `20.198.x.x`).
2. Paste `http://20.198.x.x` into a web browser tab and press Enter.
3. The browser tab continuously spins and eventually fails with **`ERR_CONNECTION_TIMED_OUT`**!

### The Root Cause:
Even though Apache is active and running inside the virtual machine, Microsoft Azure wraps every VM in a default **Network Security Group (NSG)**. The NSG contains a default security rule named `DenyAllInbound` with priority 65500 that drops all inbound internet traffic unless explicitly allowed. During VM setup, we only opened Port 22 (SSH). Port 80 (HTTP) was completely blocked!

### The Resolution (Opening Port 80 in NSG):
1. In the Azure Portal, navigate to your VM (`my-web-server`).
2. In the left-hand navigation menu, under **Networking**, click **Network settings** (or **Networking**).
3. Under the **Inbound port rules** tab, click **Add inbound port rule** on the right side.
4. Configure the rule:
   - **Source:** `Any`
   - **Source port ranges:** `*`
   - **Destination:** `Any`
   - **Service:** Select `HTTP` (or set Destination port ranges to `80`)
   - **Protocol:** `TCP`
   - **Action:** `Allow`
   - **Priority:** `300` (must be lower number than 65500 to take precedence)
   - **Name:** `Port_80` (or `Allow-HTTP-80`)
5. Click **Add**. Wait 10 to 15 seconds for Azure to deploy the rule to the virtual network adapter.
6. Switch back to your web browser tab and hit Refresh &rarr; **"Welcome to Apache Web Server on Azure"** appears instantly!

---

## 8. Managing Virtual Machines with Azure CLI / Cloud Shell

You can execute every step demonstrated above from the terminal using the Azure CLI (`az`):

```bash
# 1. Authenticate to Azure
az login

# 2. Create the Resource Group
az group create --name azure-vm-rg --location centralindia

# 3. Create cloud-init bootstrap file
cat << 'EOF' > cloud-init.txt
#!/bin/bash
apt-get update -y
apt-get install -y apache2
systemctl start apache2
systemctl enable apache2
echo "<h1>Welcome to Apache Web Server on Azure</h1>" > /var/www/html/index.html
EOF

# 4. Deploy the Virtual Machine with Custom Data and Auto-Generated SSH Keys
az vm create \
  --resource-group azure-vm-rg \
  --name my-web-server \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --custom-data cloud-init.txt \
  --public-ip-sku Standard

# 5. Open Port 80 in Network Security Group
az vm open-port --resource-group azure-vm-rg --name my-web-server --port 80 --priority 300

# 6. Retrieve the Public IP Address
az vm show -d --resource-group azure-vm-rg --name my-web-server --query publicIps -o tsv

# 7. Query VM Runtime Power State
az vm get-instance-view --name my-web-server --resource-group azure-vm-rg --query "instanceView.statuses[1].displayStatus" -o tsv
```

---

## 9. The Billing Trap: "Stopped" vs. "Stopped (Deallocated)"

A critical financial mistake made by beginners is shutting down a VM from inside the guest OS or clicking stop without deallocating:

| State | Portal Status | CPU & RAM Billing | Storage Disk Billing | Public IP Retained? |
| :--- | :--- | :---: | :---: | :---: |
| **Running** | `VM running` | 💸 Full Price | 💸 Full Price | ✅ Yes |
| **Guest OS Shutdown** (`sudo shutdown`) | `Stopped` | 💸 **STILL CHARGED!** | 💸 Full Price | ✅ Yes |
| **Azure Portal Deallocated** | `Stopped (deallocated)` | 🛑 **₹0 / $0 (FREE)** | 💸 Disk storage only | ⚠️ Released (unless Static) |

### Correct CLI Power Management Commands:
```bash
# 1. Stop AND Deallocate (Stops Compute Billing!)
az vm deallocate --resource-group azure-vm-rg --name my-web-server

# 2. Start the VM again when you resume working
az vm start --resource-group azure-vm-rg --name my-web-server
```

---

## 10. Complete Lab Teardown Protocol ($0 Bill Guarantee)

Because Azure Resource Groups act as a single lifecycle container, you never need to delete the disk, public IP, NIC, and NSG individually:

```bash
# Delete all resources in one single command without waiting
az group delete --name azure-vm-rg --yes --no-wait
```

---

## Summary Checklist
- [x] **Compute Foundations:** Virtual Machines represent IaaS; you manage the OS, runtimes, security updates, and firewalls.
- [x] **SKU Sizing:** Use B-series (`Standard_B1s`) for free-tier development and burstable testing.
- [x] **Storage Distinction:** OS Disks (`sda`) are persistent in remote storage; Temporary Disks (`sdb` / `/mnt`) are wiped on reboot.
- [x] **Automated Bootstrapping:** Used Custom Data / cloud-init script to install and enable Apache2 on first boot.
- [x] **Dual Connection Modes:** Connected via Azure Portal In-Browser CLI terminal (`Configure + Check Access`) and local terminal using SSH with `.pem` key.
- [x] **Service Verification:** Verified Apache2 using `systemctl status apache2`, `cat /var/www/html/index.html`, and `curl http://localhost`.
- [x] **NSG Inbound Rules:** Diagnosed browser timeout caused by default deny rules and resolved by adding Port 80 (HTTP) Allow rule.
- [x] **Cost Prevention:** Understood the difference between `Stopped` (still billed for CPU) and `Stopped (deallocated)` (compute bill is zero).
