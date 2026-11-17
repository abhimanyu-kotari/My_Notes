Source Timeframe: 00:51:42 to 01:44:43

# Module 02: Compute (Azure Virtual Machines)

> **Lecture Flow:** A hands-on, step-by-step practical journey from zero to hosting a live Apache web server in Microsoft Azure, connecting via the in-portal CLI terminal, and resolving real-world firewall blocks.

---

## Step 1: The Core Mental Model & What We Are Building

### Computer vs. Production Server:
- **Personal Computer (Laptop):** Used for personal daily activities (coding, gaming, browsing). You turn it off when you go to sleep, it connects through home Wi-Fi with a dynamic IP, and it is not exposed to the public internet.
- **Production Server:** Its entire job is to actively **serve** content (e.g., serving website pages, databases, or APIs) 24 hours a day, 365 days a year without ever shutting down.

### Why Do We Call It a "Virtual" Machine?
Because there is no physical computer sitting on your desk. The actual physical hardware sits inside Microsoft's enterprise datacenters. You select your desired specifications (vCPU cores, RAM memory, OS version, disk size), and Microsoft's hypervisor partitions that hardware for you. You connect to and manage it entirely over the internet.

### The Real-World Project We Are Solving:
You built a website for your business. The code is ready. Now you need a server to host it on the internet.
- **Old Way:** Buy an expensive physical server, place it in your office, pay for 24/7 electricity, air conditioning, and a static commercial internet line.
- **Azure Way:** Spin up an Ubuntu Linux Virtual Machine in Azure, automatically install the **Apache2 web server** via a startup script, connect to it, and expose it safely to the global internet on **Port 80**.

---

## Step 2: Opening the Azure Portal & Checking Existing Resources
1. Open your web browser and navigate to **portal.azure.com**.
2. Sign in with your Azure Free Account credentials.
3. In the left navigation menu, click **All resources**:
   - Notice that the list is currently completely empty. No resources exist yet.
4. In the top global search bar, type `Virtual machines` and click on the **Virtual machines** service icon.
5. On the Virtual Machines dashboard, click **+ Create** &rarr; select **Azure virtual machine**.

---

## Step 3: Configuring the Virtual Machine (The Basics Tab)

Follow the exact configuration options demonstrated in the lecture:

### 1. Project Details
- **Subscription:** Select your active subscription (e.g., `Azure subscription 1` / Free Trial).
- **Resource Group:** Every single resource in Azure must live inside a Resource Group. Click **Create new** &rarr; enter name: `azure-vm-rg`.

### 2. Instance Details
- **Virtual Machine Name:** Enter `my-web-server`.
- **Region:** Choose the region closest to your end users. For example, select `(Asia Pacific) Central India` (Pune) or `South Central India`.
- **Availability Options:** Select **Availability Zone** &rarr; choose **Zone 1**.
  - *Why Zone 1?* An Availability Zone is a physically separate datacenter building with its own independent power, cooling, and networking. Deploying in an Availability Zone guarantees a **99.99% uptime SLA**.
- **Security Type:** Select `Standard`.
- **Image:** Choose `Ubuntu Server 22.04 LTS - x64 Gen2`.
  - *"LTS" stands for Long Term Support, meaning Canonical and Microsoft provide 5 years of free security updates.*
- **VM Architecture:** `x64`.
- **Size:** Click *See all sizes* &rarr; select **`Standard_B1s`** (1 vCPU, 1 GiB RAM).
  - *Why B1s?* The B-series is burstable, highly economical, and **100% Free Tier eligible** (giving you 750 free hours every month for your first 12 months).

### 3. Administrator Account (Authentication)
- **Authentication Type:** Select **SSH public key**.
  - *Why not a password?* Passwords can be brute-forced by automated internet bots. SSH keys use 2048-bit RSA cryptography that cannot be guessed or cracked.
- **Username:** `azureuser` (or leave default).
- **SSH Public Key Source:** Select **Generate new key pair**.
- **Key Pair Name:** Azure suggests `my-web-server_key`. Keep this name.

### 4. Inbound Port Rules
- **Public Inbound Ports:** Select **Allow selected ports**.
- **Select Inbound Ports:** Check **only `SSH (22)`**.
  - *Leave HTTP (80) unchecked for now.* In the lecture, we deliberately leave Port 80 closed to witness the real-world firewall behavior and learn how to diagnose it.

---

## Step 4: The Advanced Tab & Automated Cloud-Init Script

Instead of manually installing software after connecting, we configure the VM to install Apache automatically the second it boots!

1. At the top of the creation wizard, click on the **Advanced** tab (or click Next through Disks, Networking, and Management).
2. Scroll down to the section titled **Custom data and cloud-init**.
3. In the **Custom data** text box, paste the exact automated bash script from the lecture:

```bash
#!/bin/bash
apt-get update -y
apt-get install -y apache2
systemctl start apache2
systemctl enable apache2
echo "<h1>Welcome to Apache Web Server on Azure</h1>" > /var/www/html/index.html
```

### What This Script Does in the Background:
- `apt-get update -y`: Updates the Ubuntu package repository index.
- `apt-get install -y apache2`: Downloads and installs the Apache HTTP Web Server.
- `systemctl start apache2`: Starts the Apache background daemon service immediately.
- `systemctl enable apache2`: Configures Apache to automatically restart if the VM reboots.
- `echo ... > /var/www/html/index.html`: Creates our custom website home page in the web root directory.

---

## Step 5: Review, Create & Downloading the Private Key
1. Click the blue **Review + create** button at the bottom.
2. Azure validates your settings. When you see **Validation passed**, click **Create**.
3. A modal popup will appear: **"Generate new key pair"**.
4. Click **Download private key and create resource**.
5. Your browser will download the file: **`my-web-server_key.pem`**.
   - *Keep this file safe! It is your secret cryptographic key. If lost, you cannot recover it from Azure.*
6. Azure begins provisioning the virtual machine (takes 1 to 2 minutes).

---

## Step 6: What Did Azure Create Behind the Scenes?

While the deployment finishes, navigate to **Resource groups** &rarr; click on **`azure-vm-rg`**. Look at all the interconnected resources created automatically:

| Resource Name | Resource Type | Purpose |
| :--- | :--- | :--- |
| **`my-web-server`** | Virtual Machine | The compute instance running Ubuntu Linux. |
| **`my-web-server-nsg`** | Network Security Group | The virtual firewall filtering inbound and outbound network traffic. |
| **`my-web-server-ip`** | Public IP Address | The globally routable internet IP address assigned to reach the server. |
| **`my-web-server-nic`** | Network Interface Card | Connects the VM to the virtual network adapter. |
| **`azure-vm-rg-vnet`** | Virtual Network (VNet) | The private software-defined network isolating your cloud assets. |
| **`default`** | Subnet | An IP address range (10.0.0.0/24) inside the virtual network. |
| **`my-web-server_OsDisk_1`** | Managed Disk (SSD) | The 30 GB persistent drive containing the Ubuntu OS filesystem. |

---

## Step 7: Connecting to the VM via Azure Portal (SSH via Azure CLI)

Once deployment says **"Your deployment is complete"**, click **Go to resource**. Now, how do we access and control the server?

The lecturer demonstrates the built-in **In-Portal CLI connection** (no local terminal needed):

1. On the VM overview page, look at the top toolbar and click **Connect**.
2. Select **More ways to connect** from the dropdown &rarr; click **SSH using Azure CLI**.
3. In the setup panel, click the blue button: **Configure + Check Access**.
   - Azure checks 4 prerequisites:
     - [x] Virtual machine is running
     - [x] Inbound port 22 is open in the NSG
     - [x] Network Interface is properly attached
     - [x] Azure Cloud Shell CLI proxy is authorized
4. When all 4 status checks display a green checkmark, click **Connect**.
5. A command-line terminal drawer automatically slides up from the bottom of your Azure Portal!
6. When prompted: `Are you sure you want to continue connecting (yes/no/[fingerprint])?` &rarr; Type `yes` and press Enter.
7. You are now logged into your live Ubuntu server:
   ```text
   azureuser@my-web-server:~$
   ```

---

## Step 8: Terminal Verification Commands (Run Inside the VM)

Now that you have a live command prompt inside your server, run the exact verification commands demonstrated in the video:

### 1. Clear the Screen
```bash
clear
# Or press Ctrl + L
```

### 2. Verify Apache2 is Active and Running
```bash
systemctl status apache2
```
**Expected Output:**
```text
● apache2.service - The Apache HTTP Server
     Loaded: loaded (/lib/systemd/system/apache2.service; enabled; vendor preset: enabled)
     Active: active (running) since Tue 2026-11-17 14:30:12 UTC; 2min ago
```
*Notice it says `active (running)`! This proves our Custom Data cloud-init script ran successfully during boot.*

### 3. Check the Generated HTML File
```bash
cat /var/www/html/index.html
```
**Expected Output:**
```html
<h1>Welcome to Apache Web Server on Azure</h1>
```

### 4. Test the Web Server Locally Inside the VM
```bash
curl http://localhost
```
**Expected Output:**
```html
<h1>Welcome to Apache Web Server on Azure</h1>
```
*Apache responds instantly on `localhost`! Our website is running.*

---

## Step 9: The Port 80 Browser Timeout Trap & NSG Fix

Now comes the crucial real-world lesson taught in the lecture:

### The Problem:
1. In the Azure Portal, go back to the **my-web-server** overview page.
2. Locate the **Public IP address** (e.g., `20.198.64.120`). Copy it to your clipboard.
3. Open a new tab in your web browser, paste `http://20.198.64.120`, and press Enter.
4. **The browser hangs continuously and eventually fails with `ERR_CONNECTION_TIMED_OUT`!**

### Why Did It Fail? (The Root Cause):
Even though Apache is active and responding to `curl http://localhost` *inside* the server, external internet users cannot reach it. Why?
Because in Step 3, we only checked **Port 22 (SSH)**. In Azure, every VM is shielded by a **Network Security Group (NSG)**. The NSG contains a default rule named `DenyAllInbound` that drops all incoming web traffic on Port 80!

### The Solution: Adding an Inbound Port Rule for HTTP (Port 80)
1. In the Azure Portal, open your VM (`my-web-server`).
2. In the left navigation menu, under **Networking**, click **Network settings** (or **Networking**).
3. Select the **Inbound port rules** tab.
4. On the far right, click the **Add inbound port rule** button.
5. In the slide-out panel, configure:
   - **Source:** `Any`
   - **Source port ranges:** `*`
   - **Destination:** `Any`
   - **Service:** Select `HTTP` (this automatically sets Destination port ranges to `80` and Protocol to `TCP`)
   - **Action:** `Allow`
   - **Priority:** `300` (must be lower than 65500)
   - **Name:** `Port_80` (or `Allow-HTTP-80`)
6. Click **Add**. Wait 10 to 15 seconds for Azure to update the firewall.
7. Switch back to your browser tab with `http://<Public-IP>` and hit **Refresh**!
8. **"Welcome to Apache Web Server on Azure"** renders instantly! 🎉

---

## Step 10: Connecting from Your Local Computer Terminal (Native SSH)

You can also connect to the VM directly from your laptop's terminal using the `.pem` file downloaded in Step 5:

### On macOS / Linux / WSL:
```bash
# 1. Restrict private key permissions (SSH blocks keys that are too open)
chmod 400 ~/Downloads/my-web-server_key.pem

# 2. Connect via SSH using the VM's Public IP
ssh -i ~/Downloads/my-web-server_key.pem azureuser@<VM-PUBLIC-IP>
```

### On Windows PowerShell (Fixing "Permissions are too open" error):
```powershell
# 1. Remove inherited permissions
icacls.exe .\my-web-server_key.pem /inheritance:r

# 2. Grant read access strictly to your Windows username
icacls.exe .\my-web-server_key.pem /grant:r "$($env:USERNAME):(R)"

# 3. Connect via SSH
ssh -i .\my-web-server_key.pem azureuser@<VM-PUBLIC-IP>
```

---

## Step 11: The Cost Trap: "Stopped" vs. "Stopped (Deallocated)"

When you finish working on your VM, be careful how you turn it off:

| Power Action | Portal Display State | CPU/RAM Billed? | Storage Disk Billed? |
| :--- | :--- | :---: | :---: |
| Running | `Running` | 💸 Yes | 💸 Yes |
| Guest OS shutdown (`sudo shutdown now`) | `Stopped` | 💸 **YES (Still Billed!)** | 💸 Yes |
| Azure Portal **Stop** button | `Stopped (deallocated)` | 🛑 **₹0 / $0 (FREE)** | 💸 Disk only (~few cents) |

> **Always click STOP in the Azure Portal** (or run `az vm deallocate`). This releases the physical CPU and RAM hardware back to Microsoft's pool so you are not charged!

---

## Step 12: Lab Teardown Protocol ($0 Bill Guarantee)
Because all resources were grouped inside `azure-vm-rg`, you can delete everything in one single action:
1. In the Azure Portal search bar, type `Resource groups` &rarr; click `azure-vm-rg`.
2. In the top action bar, click **Delete resource group**.
3. Type `azure-vm-rg` to confirm &rarr; click **Delete**.
4. Every disk, public IP, network interface, and virtual machine is cleanly destroyed with zero orphaned billing.

---

## Summary Checklist
- [x] **Computer vs Server:** Server runs 24/7 actively serving web traffic to global users.
- [x] **Resource Group First:** Created `azure-vm-rg` as the lifecycle container for all assets.
- [x] **VM Specs:** Ubuntu 22.04 LTS, Zone 1 (99.99% SLA), B1s size (Free Tier eligible).
- [x] **Cloud-Init Automation:** Bootstrapped Apache2 and custom `index.html` via the Advanced tab Custom data script.
- [x] **In-Portal CLI Connection:** Used *Connect &rarr; SSH using Azure CLI &rarr; Configure + Check Access* to access live terminal in browser.
- [x] **Verification Commands:** Validated service with `systemctl status apache2`, `cat /var/www/html/index.html`, and `curl http://localhost`.
- [x] **NSG Port 80 Trap:** Diagnosed browser timeout and added Inbound Security Rule for HTTP (Port 80) Allow.
- [x] **Power State Rules:** Ensured VM is `Stopped (deallocated)` to stop compute billing.
