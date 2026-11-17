Source Timeframe: 00:51:42 to 01:44:43

# Module 02: Compute (Azure Virtual Machines)

> **Lecture Flow:** A comprehensive hands-on walkthrough mastering both **Linux (Ubuntu)** and **Windows Server** Virtual Machines in Microsoft Azure: deploying an automated Apache2 web server, logging in via in-portal CLI terminal and local SSH, configuring a Windows Server VM, connecting through Remote Desktop Protocol (RDP Port 3389), installing Internet Information Services (IIS), resolving Port 80 firewall traps, and stopping resource billing.

---

## Step 1: The Core Mental Model & What We Are Building

### Personal Computer vs. Production Server:
- **Personal Computer (Laptop):** Used for individual everyday tasks (browsing, writing code, gaming). It is shut down when you sleep, connected to a domestic internet connection with a dynamic private IP, and sits safely behind your home Wi-Fi router.
- **Production Server:** Its entire job is to actively **serve** content (e.g., serving website pages, databases, or APIs) 24 hours a day, 365 days a year without interruption. It runs in a climate-controlled enterprise datacenter with redundant power and a public static IP.

### Why Do We Call It a "Virtual" Machine?
Because there is no physical tower or server box sitting in your room. The actual physical hardware resides inside Microsoft's enterprise datacenters. You select your desired specifications (vCPU cores, RAM memory, OS version, disk size), and Microsoft's hypervisor partitions that hardware for you. You connect to and manage it entirely over the internet.

### The Real-World Projects We Are Solving:
In this masterclass, the instructor walks through two complementary production scenarios:
1. **Scenario A (Linux):** Deploying an Ubuntu Linux VM, bootstrapping an **Apache2** web server via automated cloud-init custom data, and connecting via SSH.
2. **Scenario B (Windows):** Provisioning a **Windows Server 2022** VM, connecting via graphical **Remote Desktop (RDP)**, and installing Microsoft's **Internet Information Services (IIS)** web server.

---

## Step 2: Opening the Azure Portal & Checking Existing Resources
1. Open your web browser and navigate to **portal.azure.com**.
2. Sign in with your Azure Free Account credentials.
3. In the left navigation menu, click **All resources**:
   - Notice that the list is currently empty.
   - When we create a Virtual Machine, Azure will automatically generate a cluster of interdependent cloud resources here.
4. In the top search bar, type `Virtual Machines` and select **Virtual machines** under Services.
5. Click **+ Create** and select **Azure virtual machine**.

---

## Step 3: Configuring the Linux Virtual Machine (The Basics Tab)
On the **Basics** tab, configure the machine details:

| Setting Field | Practical Configuration | Architectural Reason Taught in Video |
| :--- | :--- | :--- |
| **Subscription** | `Azure subscription 1` (Free Trial) | Uses your $200 free credit without charges. |
| **Resource Group** | Click *Create new* &rarr; `azure-vm-rg` | A logical container holding all resources for this lab for easy one-click deletion. |
| **Virtual machine name** | `my-web-server` | Descriptive naming convention representing its purpose. |
| **Region** | `(Asia Pacific) Central India` (or closest region) | Selecting a geographically proximate region minimizes network latency. |
| **Availability options** | `Availability zone` | Distributes VM across physically isolated datacenters within the region. |
| **Availability zone** | `Zone 1` | Guarantees Microsoft's 99.99% high-availability SLA. |
| **Security type** | `Standard` | Standard baseline security for dev/test workloads. |
| **Image** | `Ubuntu Server 22.04 LTS - x64 Gen2` | Industry-standard open-source enterprise Linux distribution. |
| **VM architecture** | `x64` | Standard 64-bit compute architecture. |
| **Size** | `Standard_B1s` (1 vCPU, 1 GiB memory) | **Free tier eligible!** Provides 750 free compute hours per month for 12 months. |
| **Authentication type** | `SSH public key` | More secure than passwords; resistant to brute-force dictionary attacks. |
| **Username** | `azureuser` | The default administrative account name. |
| **SSH public key source**| `Generate new key pair` | Azure generates a cryptographically secure 2048-bit RSA key pair. |
| **Key pair name** | `my-web-server_key` | Name of the downloadable private key (`.pem`) file. |
| **Public inbound ports** | `Allow selected ports` | Opens perimeter firewall holes into the virtual machine. |
| **Select inbound ports** | Check **SSH (22)** only | **Trap Alert:** Intentionally leave HTTP (Port 80) unchecked to demonstrate real-world NSG troubleshooting later! |

---

## Step 4: The Advanced Tab & Automated Cloud-Init Script
Instead of manually typing installation commands after the VM boots up, the lecturer automates the entire installation using **Custom data (cloud-init)**:

1. Click **Next : Disks** &rarr; leave default (Standard SSD / Premium SSD OS Disk).
2. Click **Next : Networking** &rarr; Azure automatically prepares a new Virtual Network (`azure-vm-rg-vnet`), Subnet (`default`), Public IP, and Network Security Group (NSG).
3. Click **Next : Management** &rarr; **Next : Monitoring** &rarr; **Next : Advanced**.
4. Scroll down to the **Custom data** text box.
5. Paste the automated bash bootstrapping script:

```bash
#!/bin/bash
# 1. Update the local package index
apt-get update -y

# 2. Install the Apache2 HTTP web server
apt-get install -y apache2

# 3. Start the Apache service immediately
systemctl start apache2

# 4. Enable Apache to automatically start on system reboots
systemctl enable apache2

# 5. Overwrite the default landing page with a custom welcome heading
echo "<h1>Welcome to Apache Web Server on Azure</h1>" > /var/www/html/index.html
```

> **Why this matters:** When the Linux kernel initializes, `cloud-init` executes this script with root privileges before you even log in. Your web server is fully operational the moment provisioning finishes.

---

## Step 5: Review, Create & Downloading the Private Key
1. Click **Review + create**.
2. Azure performs validation. Once you see **"Validation passed"**, click **Create**.
3. A popup appears: **"Generate new key pair"**.
4. **CRITICAL ACTION:** Click **Download private key and create resource**.
5. Save `my-web-server_key.pem` to your computer (e.g., your `Downloads` folder).
   > **Warning:** Microsoft Azure never stores your private key. If you lose this `.pem` file, you cannot SSH into your Linux VM using this identity!

---

## Step 6: What Did Azure Create Behind the Scenes?
Navigate back to **All resources** in the Azure Portal. While you only clicked "Create Virtual Machine", Azure actually deployed a cluster of **7 distinct cloud resources**:

| Resource Type | Resource Name | Purpose in Cloud Architecture |
| :--- | :--- | :--- |
| **Virtual Machine** | `my-web-server` | Compute engine (vCPU cores and RAM memory allocated on physical hypervisor). |
| **Network Security Group**| `my-web-server-nsg` | Virtual firewall filtering inbound and outbound IP traffic based on port rules. |
| **Public IP Address** | `my-web-server-ip` | Routable IPv4 address accessible from anywhere across the global internet. |
| **Network Interface** | `my-web-server<id>` | Virtual network card (NIC) bridging the VM compute unit to the virtual network. |
| **Virtual Network** | `azure-vm-rg-vnet` | Isolated private software-defined network boundary inside Azure. |
| **Subnet** | `default` (10.0.0.0/24) | IP address partition inside the VNet where resources communicate privately. |
| **OS Disk** | `my-web-server_OsDisk_<id>`| Managed persistent storage disk containing the Ubuntu operating system files. |

---

## Step 7: Connecting to the Linux VM via Azure Portal (SSH via Azure CLI)
The instructor demonstrates how to open a command terminal directly inside the web browser without installing any third-party SSH client:

1. Click on your virtual machine `my-web-server`.
2. In the top toolbar, click **Connect** &rarr; select **Connect** (or click *More ways to connect*).
3. Choose **SSH using Azure CLI**.
4. Notice the **Configure + Check Access** section:
   - Azure checks 4 prerequisites: *SSH port open (Port 22)*, *Public IP assigned*, *Network connectivity*, and *Valid credentials*.
5. In the dropdown, select your authentication credentials:
   - Provide the private key file or configure SSH login.
6. Click **Connect** &rarr; an interactive browser-based terminal session opens directly into your Ubuntu machine!
7. The shell prompt appears: `azureuser@my-web-server:~$`.

---

## Step 8: Terminal Verification Commands (Run Inside the VM)
Run these commands inside your virtual machine terminal to verify the automated cloud-init setup:

```bash
# 1. Clear the screen for a clean workspace
clear

# 2. Verify that Apache2 is running and active
systemctl status apache2
```
*Expected Output:* `Active: active (running)` highlighted in bright green.

```bash
# 3. Inspect the custom HTML file written by our cloud-init script
cat /var/www/html/index.html
```
*Expected Output:* `<h1>Welcome to Apache Web Server on Azure</h1>`

```bash
# 4. Test web server response locally inside the virtual machine
curl http://localhost
```
*Expected Output:* The raw HTML string `<h1>Welcome to Apache Web Server on Azure</h1>` is returned instantly!

---

## Step 9: The Port 80 Browser Timeout Trap & NSG Fix

### The Problem:
1. Copy the **Public IP address** of your VM from the Azure Portal (e.g., `20.198.x.x`).
2. Open a new tab in your web browser, paste the IP address, and press Enter: `http://<YOUR_VM_PUBLIC_IP>`.
3. The browser tab spins indefinitely and eventually fails with:
   **`ERR_CONNECTION_TIMED_OUT`** or **"This site can't be reached"**.

### Why Did It Fail?
- The Apache web server is running perfectly inside the VM (verified via `curl http://localhost`).
- The failure occurs at the **Network Security Group (NSG)** perimeter firewall!
- When configuring the Basics tab in Step 3, we only checked **Port 22 (SSH)**.
- Azure NSGs follow a strict **Default Deny** rule for inbound internet traffic. All incoming requests on **Port 80 (HTTP)** are blocked at the cloud boundary before reaching your VM.

### The Fix: Adding an Inbound Security Rule
1. In the Azure Portal left menu for `my-web-server`, click **Networking** (or **Network settings**).
2. Look at the **Inbound port rules** table:
   - Notice rule `SSH` (Port 22) is Allowed with Priority 300.
   - Below it are default rules: `AllowVnetInBound`, `AllowAzureLoadBalancerInBound`, and `DenyAllInBound` (Priority 65500).
3. Click **+ Add inbound port rule** on the top right.
4. Configure the rule:
   - **Source:** `Any`
   - **Source port ranges:** `*`
   - **Destination:** `Any`
   - **Service:** Select `HTTP` (Azure automatically populates destination port `80` and protocol `TCP`).
   - **Action:** `Allow`
   - **Priority:** `310` (any value lower than 65500 takes precedence over DenyAll).
   - **Name:** `Allow-HTTP-Port-80`
5. Click **Add**. Wait 5–10 seconds for the rule to provision.
6. Return to your browser tab and refresh `http://<YOUR_VM_PUBLIC_IP>`:
   - **Instant Success!** The page renders: **"Welcome to Apache Web Server on Azure"**.

---

## Step 10: Windows Virtual Machine Setup (Windows Server & RDP)
After deploying Linux, the instructor demonstrates spinning up a **Windows Virtual Machine** to contrast Linux CLI administration with full graphical Windows desktop administration.

### Why Deploy a Windows VM?
- Hosting legacy enterprise .NET Framework applications, Microsoft SQL Server, or Active Directory tools.
- Remote development environments for software engineers who need a dedicated Windows workstation in the cloud.
- Administration via graphical **Remote Desktop Protocol (RDP)** instead of command-line SSH.

### Step-by-Step Portal Configuration:
1. Navigate back to **Virtual machines** &rarr; click **+ Create** &rarr; **Azure virtual machine**.
2. **Basics Tab Settings:**
   - **Resource group:** Select existing `azure-vm-rg`.
   - **Virtual machine name:** `my-windows-server`
   - **Region:** `(Asia Pacific) Central India` (same region).
   - **Availability zone:** `Zone 1`
   - **Image:** Select **Windows Server 2022 Datacenter: Azure Edition - x64 Gen2**.
   - **Size:** Select **`Standard_B2s` (2 vCPUs, 4 GiB memory)**.
     > **Sizing Rule:** While Linux runs smoothly on 1 vCPU and 1 GB RAM (`Standard_B1s`), the Windows graphical shell and background services require at least 2 vCPUs and 4 GB RAM (`Standard_B2s`) to prevent freezing.
   - **Administrator account:**
     - Windows VMs do NOT use SSH key pairs by default; they use username and password authentication.
     - **Username:** `azureuser`
     - **Password:** Enter a complex password (at least 12 characters, uppercase, lowercase, number, special character).
   - **Public inbound ports:** Select **Allow selected ports**.
   - **Select inbound ports:** Check **RDP (3389)**.
     > **Port 3389** is the dedicated network port used by Microsoft's Remote Desktop Protocol.
3. Click **Review + create** &rarr; confirm validation &rarr; click **Create**.
4. Wait 2–3 minutes for deployment to complete.

---

## Step 11: Connecting to Windows VM via Remote Desktop (RDP)
Once `my-windows-server` is in the **Running** state:

1. Click on `my-windows-server` to open its Overview page.
2. In the top toolbar, click **Connect** &rarr; select **Connect** (or click *RDP*).
3. Under the **Native RDP** tab:
   - Verify Public IP address and Port number (`3389`).
   - Click the blue **Download RDP file** button.
4. Save the file `my-windows-server.rdp` to your desktop.
5. **Open the RDP Session:**
   - **On Windows:** Double-click the downloaded `.rdp` file. It opens the built-in **Remote Desktop Connection (`mstsc.exe`)** client.
   - **On macOS:** Install and open **Microsoft Remote Desktop** from the Mac App Store, then drag and drop the `.rdp` file into the app.
6. A warning dialog appears: *"The publisher of this remote connection cannot be identified. Do you want to connect?"* &rarr; Click **Connect**.
7. Enter your login credentials:
   - Username: `azureuser`
   - Password: `<Your_Complex_Password>`
8. A certificate warning dialog appears: *"The identity of the remote computer cannot be verified. Do you want to connect anyway?"* &rarr; Click **Yes**.
9. **Boom!** A full graphical Windows desktop boots up inside your client window. You now have a high-speed cloud Windows Server at your fingertips.

---

## Step 12: Installing IIS Web Server on Windows Server (GUI & PowerShell)
Inside the Windows remote desktop, the lecturer installs Microsoft's native web server, **Internet Information Services (IIS)**:

### Method A: The PowerShell Way (Fast & Automated)
1. In the remote Windows desktop, click the Start menu, right-click **Windows PowerShell**, and select **Run as Administrator**.
2. Run the Windows feature installation command:

```powershell
Install-WindowsFeature -name Web-Server -IncludeManagementTools
```

3. PowerShell displays a progress bar: `[||||||||||                ] Collecting Data...`.
4. When finished, it reports: `Success: True`, `Restart Needed: No`.

### Method B: Testing the Windows Web Server
1. Inside the remote desktop, open Microsoft Edge or Internet Explorer.
2. In the address bar, type:
   ```
   http://localhost
   ```
3. **Result:** The official blue **Internet Information Services (IIS) Windows Server** landing page appears! The web server is actively listening on local port 80.
4. **Exposing IIS to the Internet:**
   - Just like our Linux machine, if you try visiting the Windows VM's Public IP from your laptop browser, it will timeout until you add an Inbound Rule in `my-windows-server-nsg` allowing **Port 80 (HTTP)**.
   - Once Port 80 is allowed in NSG, your Windows Server IIS page is live to the entire world!

---

## Step 13: Linux VM vs. Windows VM (Head-to-Head Architectural Comparison)

| Architectural Feature | Linux VM (Ubuntu 22.04) | Windows VM (Windows Server 2022) |
| :--- | :--- | :--- |
| **Primary Admin Protocol**| **SSH (Secure Shell)** on **Port 22** | **RDP (Remote Desktop Protocol)** on **Port 3389** |
| **Authentication Method** | Cryptographic SSH Key Pair (`.pem`) | Administrator Username + Complex Password |
| **User Interface** | Headless command-line terminal (CLI) | Full Graphical User Interface (GUI Desktop) |
| **Minimum Hardware Sizing**| `Standard_B1s` (1 vCPU, 1 GB RAM) | `Standard_B2s` (2 vCPUs, 4 GB RAM) |
| **Default Web Server** | **Apache2** or **Nginx** | **Internet Information Services (IIS)** |
| **Default Web Root** | `/var/www/html/index.html` | `C:\inetpub\wwwroot\iisstart.htm` |
| **OS Licensing Cost** | Free & Open Source ($0 license fee) | Windows Server license fee included in hourly price |
| **Resource Overhead** | Extremely lightweight; low RAM baseline | Higher idle RAM & disk footprint due to GUI |

---

## Step 14: Connecting from Local Computer Terminal (Native SSH for Linux)
For your Linux VM, you don't need the Azure portal browser window. You can SSH directly from your laptop terminal using your downloaded `my-web-server_key.pem`:

### On macOS / Linux:
```bash
# 1. Restrict private key permissions (SSH refuses open keys)
chmod 400 ~/Downloads/my-web-server_key.pem

# 2. SSH into the Azure Virtual Machine
ssh -i ~/Downloads/my-web-server_key.pem azureuser@<YOUR_VM_PUBLIC_IP>
```

### On Windows (PowerShell):
```powershell
# 1. Reset permissions so only your user account can read the key
icacls .\my-web-server_key.pem /inheritance:r
icacls .\my-web-server_key.pem /grant:r "$($env:USERNAME):(R)"

# 2. Connect via OpenSSH
ssh -i .\my-web-server_key.pem azureuser@<YOUR_VM_PUBLIC_IP>
```

---

## Step 15: The Cost Trap: "Stopped" vs. "Stopped (Deallocated)"
The instructor warns about one of the most common billing pitfalls in Azure:

```
+-----------------------------------------------------------------------------------------+
|                  THE VIRTUAL MACHINE BILLING STATE COMPARISON                           |
+-----------------------------------------------------------------------------------------+
|  STATE IN PORTAL           | PHYSICAL HARDWARE RESERVED?  | COMPUTE BILLING RUNNING?     |
+----------------------------+------------------------------+------------------------------+
|  Running                   | YES (Dedicated host slot)    | YES (Charged per second)     |
|  Stopped (Guest Shutdown)  | YES (Hardware held for you)  | YES! (BILL STILL CHARGES!)   |
|  Stopped (deallocated)     | NO (Released back to Azure)  | NO ($0 COMPUTE CHARGE!)      |
+-----------------------------------------------------------------------------------------+
```

> **CRITICAL RULE:** If you shut down a virtual machine from inside the operating system (e.g., clicking Start &rarr; Shut Down in Windows, or running `sudo poweroff` in Ubuntu), the Azure Portal status displays **Stopped**. Microsoft **CONTINUES TO CHARGE YOU** for the compute cores because the physical host server remains reserved for your instant restart!
>
> **The Solution:** Always click the **Stop** button in the Azure Portal toolbar. Confirm that the status explicitly changes to **Stopped (deallocated)**.

---

## Step 16: Lab Teardown Protocol ($0 Bill Guarantee)
Because we placed all resources for both the Linux VM and the Windows VM into a single dedicated Resource Group (`azure-vm-rg`), deleting the entire lab takes one single action:

1. In the Azure Portal search bar, type `Resource groups` and click on **azure-vm-rg**.
2. Click **Delete resource group** in the top toolbar.
3. In the confirmation box, type the resource group name: `azure-vm-rg`.
4. Click **Delete**.
5. Azure deletes both Virtual Machines, their OS Disks, Public IPs, Network Interfaces, NSGs, and the Virtual Network concurrently.
6. Your account returns to a clean $0 billing state!

---

## Summary Checklist
- [x] I understand the architectural difference between a personal computer and a 24/7 production cloud server.
- [x] I created an Ubuntu Linux VM (`my-web-server`) using the free-tier eligible `Standard_B1s` size in Zone 1.
- [x] I automated Apache2 web server bootstrapping using the **Custom data (cloud-init)** script under the Advanced tab.
- [x] I connected directly via the Azure Portal web terminal using **SSH via Azure CLI** (Configure + Check Access).
- [x] I verified Apache2 active status with `systemctl status apache2` and tested local response with `curl http://localhost`.
- [x] I diagnosed the Port 80 browser timeout caused by NSG default deny rules and added an **Inbound HTTP Allow rule**.
- [x] I created a **Windows Server 2022** VM (`my-windows-server`) using `Standard_B2s` and username/password authentication.
- [x] I connected to the Windows desktop using **Remote Desktop Protocol (RDP Port 3389)** and the downloaded `.rdp` file.
- [x] I installed **IIS Web Server** on Windows Server using PowerShell `Install-WindowsFeature -name Web-Server`.
- [x] I know the core differences between SSH (Port 22) and RDP (Port 3389).
- [x] I know that only **Stopped (deallocated)** releases physical hardware and stops Azure compute billing.
- [x] I cleanly destroyed all lab infrastructure by deleting the parent Resource Group (`azure-vm-rg`).
