Source Timeframe: 00:51:42 to 01:44:43

# Module 02: Compute (Azure Virtual Machines)

## 1. Introduction to Azure Compute & Virtual Machines
In Microsoft Azure, **Compute** refers to any cloud service that provides CPU processing power, RAM, and operational execution capacity. The fundamental IaaS compute offering is the **Azure Virtual Machine (VM)**.

An Azure Virtual Machine gives you complete root/administrator control over a virtualized operating system (Ubuntu, Debian, RHEL, Windows Server) running inside Microsoft datacenters.

```
+--------------------------------------------------------------+
|               AZURE VIRTUAL MACHINE ANATOMY                  |
|                                                              |
|   +------------------------------------------------------+   |
|   |         Operating System (Ubuntu Linux / Windows)    |   |
|   |         Applications, Services, Runtime, Docker      |   |
|   +------------------------------------------------------+   |
|            |                          |                      |
|      [ vCPU / RAM ]            [ Storage Disks ]             |
|   Selected VM Size/SKU     * OS Disk (e.g. 30GB SSD)         |
|   (e.g., Standard_B1s)     * Data Disks (Persistent)         |
|            |               * Temporary Disk (Ephemeral Wipe) |
|            |                          |                      |
|   +------------------------------------------------------+   |
|   |               NETWORK INTERFACE CARD (NIC)           |   |
|   |   Private IP (VNet/Subnet)  |  Public IP (Internet)  |   |
|   |               Network Security Group (NSG)           |   |
|   +------------------------------------------------------+   |
+--------------------------------------------------------------+
```

---

## 2. Choosing VM Sizes & Series (SKUs)
Azure categorizes VMs into specialized series (families) optimized for specific workloads:

| Series | Category | Description | Best Suited For |
| :--- | :--- | :--- | :--- |
| **B-Series** | Burstable | Low-cost compute. Accrues CPU credits during idle times and bursts up to 100% CPU when busy. | **Student labs, dev/test environments, small web servers.** |
| **D-Series** | General Purpose | Balanced ratio of vCPU to RAM (typically 4GB RAM per vCPU). | Enterprise web apps, medium databases, microservices. |
| **F-Series** | Compute Optimized | High CPU-to-memory ratio; fast processing clock speeds. | Batch processing, analytics, web servers, code compilation. |
| **E-Series** | Memory Optimized | High memory-to-CPU ratio (e.g., 8GB+ RAM per vCPU). | In-memory caches (Redis), relational databases (SQL, SAP HANA). |
| **N-Series** | GPU Accelerated | Powered by NVIDIA GPUs for heavy parallel compute. | Deep Learning training, AI model inference, video rendering. |

> **Student Pro-Tip:** When practicing in Azure, always choose **`Standard_B1s`** (1 vCPU, 1 GB RAM) or **`Standard_B2s`** (2 vCPU, 4 GB RAM). These are eligible under the Azure free tier and avoid burning through your trial credits!

---

## 3. Azure VM Storage Disks: The Ephemeral Disk Trap
Every Virtual Machine is created with three distinct disk types:

```
[ Azure Virtual Machine ]
      │
      ├── 1. OS Disk (Persistent SSD): Contains the boot files & OS root (/ or C:)
      │      Preserved across reboots, stops, and deallocations.
      │
      ├── 2. Data Disks (Persistent SSD): Dedicated disks attached for databases & apps.
      │      Persists independently of the VM lifecycle.
      │
      └── 3. Temporary Disk (EPHEMERAL WIPE): Physical disk on the host rack.
             Mounted at /mnt or D: drive.
```

### ⚠️ CRITICAL WARNING: The Temporary Disk is Ephemeral!
The temporary disk (mounted at `/mnt` in Linux or `D:` in Windows) is a physical SSD located on the physical server blade. 
- It is intended **only** for pagefiles, swap space, and transient caches.
- Whenever your VM is stopped, deallocated, or migrated during datacenter maintenance, **EVERY BYTE OF DATA ON THIS DISK IS IRREVERSIBLY DELETED**.
- Azure automatically places a text file at `/mnt/DATALOSS_WARNING_README.txt` warning you never to store databases or project files there!

### Managed Disk Tiers:
- **Standard HDD:** Magnetic spinning platters. Lowest cost, used for backups.
- **Standard SSD:** Entry-level solid-state storage for consistent dev/test performance.
- **Premium SSD (v1 & v2):** High IOPS and low sub-millisecond latency. Required for production databases.
- **Ultra Disk:** Extreme performance (up to 160,000 IOPS and 2,000 MB/s throughput) for top-tier transactional systems.

---

## 4. Method 1: Creating a VM via Azure Cloud Shell (In-Browser CLI)
The Azure Cloud Shell is an authenticated, browser-accessible Linux shell running directly inside the Azure Portal.

### Step 1: Open Cloud Shell
Click the **Cloud Shell (`>_`)** button in the Azure Portal top navigation bar. Choose **Bash**.

### Step 2: Create a Resource Group
```bash
az group create --name rg-azure-demo --location eastus
```

### Step 3: Deploy the Ubuntu VM with Auto-Generated SSH Keys
```bash
az vm create \
  --resource-group rg-azure-demo \
  --name vm-cloudshell-demo \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --generate-ssh-keys \
  --public-ip-sku Standard
```

### Step 4: Inspect the Deployment
```bash
# Check power state and public IP address
az vm show -d \
  --resource-group rg-azure-demo \
  --name vm-cloudshell-demo \
  --query "{Name:name, PublicIP:publicIps, State:powerState}" \
  --output table
```

### Step 5: Open Port 80 for HTTP Web Traffic
```bash
az vm open-port \
  --resource-group rg-azure-demo \
  --name vm-cloudshell-demo \
  --port 80 \
  --priority 100
```

---

## 5. Method 2: Creating a VM from Our Local Computer (Terminal / PowerShell)
You can deploy and manage Azure VMs directly from your local laptop or PC using the Azure CLI.

### Step 1: Install the Azure CLI on Your Local Machine
- **Windows (PowerShell):**
  ```powershell
  winget install -e --id Microsoft.AzureCLI
  ```
- **macOS (Terminal):**
  ```bash
  brew install azure-cli
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
  ```

### Step 2: Authenticate to Your Azure Account
```bash
az login
```
This launches your default browser, prompts you to sign in with your Microsoft account, and links your local terminal session.

### Step 3: Set Your Active Subscription
```bash
az account list --output table
az account set --subscription "<your-subscription-id-or-name>"
```

### Step 4: Generate an SSH Key Pair on Your Computer
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/azure_local_key
```
This generates two files in `~/.ssh/`:
- `azure_local_key` (Your **Private Key** - keep secret!)
- `azure_local_key.pub` (Your **Public Key** - uploaded to Azure)

### Step 5: Create the VM Using Your Local Public Key
```bash
az vm create \
  --resource-group rg-azure-demo \
  --name vm-from-local \
  --image Ubuntu2204 \
  --size Standard_B1s \
  --admin-username azureuser \
  --ssh-key-values ~/.ssh/azure_local_key.pub \
  --public-ip-sku Standard
```

---

## 6. Method 3: Creating a VM via the Azure Portal (GUI Walkthrough)

### 1. Basics Tab:
- **Subscription:** Select your Free Trial or Pay-As-You-Go subscription.
- **Resource Group:** Select `rg-azure-demo` (or click *Create new*).
- **Virtual Machine Name:** `vm-portal-demo`
- **Region:** `(US) East US`
- **Availability Options:** `No infrastructure redundancy required` (or `Availability zone: Zone 1` for HA).
- **Security Type:** `Standard`
- **Image:** `Ubuntu Server 22.04 LTS - x64 Gen2`
- **Size:** Click *See all sizes* &rarr; Select `Standard_B1s` (1 vCPU, 1 GiB RAM).
- **Authentication Type:** Select **SSH public key**.
  - Username: `azureuser`
  - Key source: `Generate new key pair` (Key pair name: `vm-portal-demo-key`).
- **Inbound Port Rules:**
  - Public inbound ports: `Allow selected ports`
  - Select ports: `SSH (22)` and `HTTP (80)`

### 2. Disks Tab:
- **OS Disk Type:** `Standard SSD (locally-redundant storage)` (Saves money compared to Premium SSD).
- **Delete with VM:** Ensure this checkbox is **checked** so disks are deleted when the VM is destroyed.

### 3. Networking Tab:
- **Virtual Network:** Let Azure auto-create `rg-azure-demo-vnet`.
- **Subnet:** Default `default (10.0.0.0/24)`.
- **Public IP:** `(new) vm-portal-demo-ip` (Standard SKU).
- **NIC Network Security Group:** Select `Basic`.
- **Delete public IP and NIC when VM is deleted:** Check **YES**! (Prevents orphaned paid IP addresses).

### 4. Management Tab (Crucial Cost Saving):
- **Enable auto-shutdown:** **CHECKED**!
  - Shutdown time: `19:00:00` (7:00 PM UTC)
  - Time zone: Set your local timezone.
  - Notification email: Enter your email.
  - *If you forget to deallocate your lab VM, Azure automatically shuts it down every evening!*

### 5. Review + Create:
- Validation will pass. Click **Create**.
- A popup will appear: **"Generate new key pair"**. Click **Download private key and create resource**.
- Save the file `vm-portal-demo-key.pem` to your computer.

---

## 7. Connecting to Your VM & Fixing SSH Key Permissions

### Fixing Permissions on Linux / macOS:
SSH requires private key files to have strict permissions (`400` or read-only by user):
```bash
chmod 400 ~/.ssh/vm-portal-demo-key.pem
ssh -i ~/.ssh/vm-portal-demo-key.pem azureuser@<public-ip>
```

### Fixing Permissions on Windows (PowerShell):
If you get `WARNING: UNPROTECTED PRIVATE KEY FILE! Permissions for 'key.pem' are too open`:
```powershell
# Reset and remove inheritance
icacls.exe .\vm-portal-demo-key.pem /inheritance:r

# Grant read permission strictly to current user
icacls.exe .\vm-portal-demo-key.pem /grant:r "$($env:USERNAME):(R)"

# Connect via SSH
ssh -i .\vm-portal-demo-key.pem azureuser@<public-ip>
```

---

## 8. Essential System Inspection Commands (Run Inside the VM)
Once connected via SSH, run these real-world inspection commands:

```bash
# 1. Inspect Linux kernel release & system architecture
uname -a

# 2. Inspect CPU cores, socket count, and hypervisor virtualization
lscpu

# 3. Inspect physical RAM memory allocation in human-readable megabytes
free -m -h

# 4. Inspect mounted storage filesystems and free disk space
df -h

# 5. Inspect block devices (Notice sda for OS disk, sdb for temporary disk)
lsblk

# 6. Read Microsoft's built-in ephemeral data loss warning file!
cat /mnt/DATALOSS_WARNING_README.txt

# 7. Check private network interface and assigned IP address
ip a

# 8. Query the Azure Instance Metadata Service (IMDS) from inside the VM!
curl -s -H Metadata:true --noproxy "*" "http://169.254.169.254/metadata/instance?api-version=2021-02-01" | python3 -m json.tool
```

---

## 9. Installing Nginx Web Server & Troubleshooting NSG Rules

### Step 1: Install and Start Nginx
```bash
# Update repository index
sudo apt update

# Install Nginx web server
sudo apt install nginx -y

# Verify service status
sudo systemctl status nginx
```

### Step 2: Test Locally Inside the VM
```bash
curl -I http://localhost
```
You will receive `HTTP/1.1 200 OK`.

### Step 3: Test from Your Computer / Browser
Open your browser and navigate to:
```
http://<your-vm-public-ip>
```

### ⚠️ Troubleshooting: What if the browser hangs indefinitely?
If the page spins forever, your Network Security Group (NSG) has blocked Port 80!

**Fix it via Azure CLI:**
```bash
# 1. List existing NSG rules
az network nsg rule list \
  --resource-group rg-azure-demo \
  --nsg-name vm-cloudshell-demoNSG \
  --output table

# 2. Add an Inbound Allow Rule for Port 80
az network nsg rule create \
  --resource-group rg-azure-demo \
  --nsg-name vm-cloudshell-demoNSG \
  --name Allow-HTTP-80 \
  --priority 110 \
  --direction Inbound \
  --access Allow \
  --protocol Tcp \
  --destination-port-ranges 80
```
Refresh your browser—the Nginx default welcome page loads immediately!

---

## 10. Attaching, Formatting & Mounting a Persistent Data Disk

### Step 1: Attach a New 10 GB Managed Data Disk via CLI
```bash
az vm disk attach \
  --resource-group rg-azure-demo \
  --vm-name vm-cloudshell-demo \
  --name datadisk-01 \
  --size-gb 10 \
  --new \
  --sku StandardSSD_LRS
```

### Step 2: Find the New Disk Inside the Linux VM
```bash
lsblk
```
You will see a new raw block device: `/dev/sdc` (10G).

### Step 3: Format the Disk with ext4 Filesystem
```bash
sudo mkfs.ext4 /dev/sdc
```

### Step 4: Create Mount Point & Mount the Disk
```bash
sudo mkdir -p /datadrive
sudo mount /dev/sdc /datadrive

# Verify mount
df -h /datadrive
```

### Step 5: Configure `/etc/fstab` for Auto-Mount on Reboot
```bash
# Find the persistent UUID of the disk
sudo blkid /dev/sdc

# Append to /etc/fstab (Replace <UUID> with your actual UUID)
echo "UUID=$(sudo blkid -s UUID -o value /dev/sdc) /datadrive ext4 defaults,nofail 1 2" | sudo tee -a /etc/fstab
```

---

## 11. The Cost Trap: "Stopped" vs. "Stopped (Deallocated)"

| State | Action Taken | Compute Charges (vCPU/RAM)? | Disk & Public IP Charges? |
| :--- | :--- | :--- | :--- |
| **Running** | Normal operation | **Billed** ($/hour) | Billed |
| **Stopped** | Ran `sudo poweroff` inside VM OS | ❌ **STILL BILLED!** Hardware host slot is reserved! | Billed |
| **Stopped (Deallocated)** | Clicked *Stop* in Portal or ran `az vm deallocate` | ✅ **$0.00 / hour** (Compute released!) | Billed for storage disk only |

### CLI Commands for Power States:
```bash
# Check current power state
az vm get-instance-view \
  --resource-group rg-azure-demo \
  --name vm-cloudshell-demo \
  --query "instanceView.statuses[1].displayStatus" \
  --output tsv

# Properly Deallocate (Stops Compute Billing!)
az vm deallocate \
  --resource-group rg-azure-demo \
  --name vm-cloudshell-demo

# Start the VM again
az vm start \
  --resource-group rg-azure-demo \
  --name vm-cloudshell-demo
```

> **Dynamic Public IP Note:** When a VM is deallocated, its dynamic public IP is released. Upon starting the VM again, Azure assigns a *new* public IP address. To prevent this, assign a **Static Public IP** SKU.

---

## 12. Complete Teardown Protocol ($0 Bill Guarantee)
When you finish your lab, delete the entire Resource Group to instantly destroy the VM, disks, NICs, public IPs, and NSGs:

```bash
az group delete --name rg-azure-demo --yes --no-wait
```

---

## Summary Checklist

- [ ] I can deploy an Azure VM using **all 3 methods**: Azure Portal GUI, Azure Cloud Shell, and my local computer terminal.
- [ ] I understand the 5 VM sizing families: **B** (burstable), **D** (general), **F** (compute), **E** (memory), and **N** (GPU).
- [ ] I know why the **Temporary Disk** is ephemeral and can locate `/mnt/DATALOSS_WARNING_README.txt`.
- [ ] I know how to fix SSH key permissions on both Linux (`chmod 400`) and Windows (`icacls`).
- [ ] I can inspect VM hardware using `uname`, `lscpu`, `free -m`, `df -h`, and query Azure IMDS metadata.
- [ ] I can install Nginx, test locally with `curl`, and troubleshoot NSG port 80 firewall blocks.
- [ ] I know how to attach, format (`mkfs.ext4`), mount, and persist a data disk in `/etc/fstab`.
- [ ] I know the critical difference between **Stopped** (still billed!) and **Stopped (Deallocated)** ($0 compute).
- [ ] I can teardown the entire lab in one command with `az group delete`.