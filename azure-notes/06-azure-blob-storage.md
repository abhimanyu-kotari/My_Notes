Source Timeframe: 04:43:48 to 05:25:13

# Module 06: Azure Blob Storage

## 1. What is Azure Blob Storage?
Modern applications produce staggering amounts of unstructured data—millions of smartphone photos, high-resolution CCTV videos, sensor telemetry, server access logs, medical scans, and AI training datasets. Relational SQL databases are not designed to store multi-gigabyte video files efficiently.

**Azure Blob Storage** is Microsoft's massively scalable, durable, and highly available **Object Storage service**. 
- The word **"BLOB"** stands for **B**inary **L**arge **OB**ject.
- It stores any type of digital file in native binary format without requiring you to format a disk or partition file systems.
- You can access blobs from anywhere in the world over standard HTTP/HTTPS protocols.

---

## 2. Real-World Analogy: The Amazon Fulfillment Center
Imagine a gigantic logistics warehouse:
- **Storage Account:** The entire Amazon distribution building with its unique postal address and security checkpoint.
- **Container:** An organized storage aisle or bin inside the warehouse (e.g., `user-avatars`, `invoice-pdfs`, `system-logs`).
- **Blob:** The individual packaged parcels and boxes sitting on the shelves (e.g., `user-1049.png`, `bill-may-2026.pdf`).

### Azure Blob Storage Hierarchy

- **Storage Account:** Top-level namespace with global endpoint `https://<accountname>.blob.core.windows.net`
  - 📁 **Container 1: `images`** (Logical folder / directory bucket)
    - 📄 `profile.jpg`
    - 📄 `banner.png`
  - 📁 **Container 2: `documents`**
    - 📄 `resume.pdf`
    - 📄 `quarterly-report.xlsx`
  - 📁 **Container 3: `$web`** (Special root container for static website hosting)
    - 📄 `index.html`
    - 📄 `error.html`

### Storage Account Naming Rules (Exam & Interview Classic):
1. Name must be between **3 and 24 characters** in length.
2. Only **lowercase letters and numbers** allowed (no uppercase letters, hyphens, underscores, or spaces!).
3. Must be **globally unique across the entire world** because it forms a public DNS subdomain:  
   `https://<your-storage-account-name>.blob.core.windows.net/`

---

## 3. The Three Types of Blobs

| Blob Type | Primary Use Case | Maximum Size | Key Characteristics |
| :--- | :--- | :--- | :--- |
| **Block Blobs** | Images, videos, documents, zip archives, web assets | ~190.7 TB | Composed of discrete blocks (up to 4,000 MiB each). Uploaded in parallel and assembled; ideal for fast streaming and standard file storage. |
| **Append Blobs** | Server logs, event audits, continuous sensor telemetry | ~195 GB | Optimized for append operations only. New data is always added to the tail end; existing blocks cannot be modified or replaced. |
| **Page Blobs** | Azure Virtual Machine Disks (`.vhd` files) | 8 TB | Optimized for random read and write operations on 512-byte aligned pages, behaving like a physical hard drive. |

---

## 4. Blob Storage Access Tiers (Cost Optimization)
Data changes in value over time. An invoice uploaded today is viewed ten times this week, but rarely touched after three years. Azure offers four access tiers to balance storage costs against access fees:

| Access Tier | Ideal Retention & Usage | Storage Unit Cost | Data Retrieval Fee | Availability SLA |
| :--- | :--- | :--- | :--- | :---: |
| **Hot** | Active daily production files, streaming assets, live websites | Highest | Lowest / Zero | 99.9% |
| **Cool** | Infrequently accessed data (stored for at least 30 days) | Lower | Moderate | 99.0% |
| **Cold** | Rarely accessed data (stored for at least 90 days) | Very Low | High | 99.0% |
| **Archive** | Offline compliance archives, legal records (minimum 180 days) | Rock Bottom | Highest (Requires hours to rehydrate) | N/A (Offline) |

### The Archive Tier & "Rehydration":
- Blobs in the **Archive Tier** are stored offline. You cannot immediately download or open an archived blob.
- To read an archived blob, you must **Rehydrate** it back to either Hot or Cool tier.
- Rehydration options:
  - **Standard Priority:** Takes between 1 and 15 hours.
  - **High Priority:** Takes under 1 hour (for blobs smaller than 10 GB), but incurs an additional urgency fee.

---

## 5. Redundancy & High Availability Options
To protect your data against hardware failure, power outages, and natural disasters, Azure automatically keeps multiple copies of every blob:

| Replication Strategy | Geographic Scope | Copies & Distribution | Durability (Annual) | Protection Level |
| :--- | :--- | :--- | :---: | :--- |
| **Locally Redundant (LRS)** | Single Datacenter (Primary) | 3 synchronous copies within one physical datacenter. | 99.999999999% (11 9s) | Protects against individual disk, rack, or server failures. |
| **Zone-Redundant (ZRS)** | Single Region (Primary) | 3 synchronous copies distributed across 3 distinct Availability Zones. | 99.9999999999% (12 9s) | Survives an entire datacenter outage (power grid or fire). |
| **Geo-Redundant (GRS)** | Secondary Paired Region | 3 copies in Primary (LRS) + asynchronous replication of 3 copies to paired region. | 99.99999999999999% (16 9s) | Protects against major regional catastrophe or natural disaster. |
| **Geo-Zone-Redundant (GZRS)** | Secondary Paired Region | 3 copies across 3 zones in Primary (ZRS) + 3 copies replicated to secondary region. | 99.99999999999999% (16 9s) | Maximum enterprise resilience combining zone + region fault tolerance. |

- **Read-Access Geo-Redundancy (RA-GRS / RA-GZRS):** Grants direct read-only access to the secondary region endpoint, allowing your application to remain readable even if an entire primary Azure region experiences an outage!

---

## 6. Storage Security: Keys vs. SAS Tokens vs. Entra ID

| Authentication Mechanism | Security Level | Access Scope | Best Practice Recommendation |
| :--- | :---: | :--- | :--- |
| **Account Access Keys (Key 1 & Key 2)** | 🚨 High Risk (Root Password) | 100% full administrative control over all containers, blobs, queues, and tables. | **NEVER** embed in code, git repositories, or mobile applications. Store exclusively in Azure Key Vault. |
| **Shared Access Signatures (SAS Tokens)** | 🛡️ Controlled & Scoped | Grants temporary, fine-grained access (e.g. read-only access to one specific photo for 15 minutes). | Ideal for client-side uploads, temporary download links, and third-party integrations. |
| **Microsoft Entra ID (Azure RBAC)** | 🔒 Enterprise Best Practice | Identity-based role assignments (e.g. `Storage Blob Data Reader`, `Storage Blob Data Contributor`). | Industry standard for production applications, Azure Virtual Machines, and managed identities. |

---

## 7. Hosting a Serverless Static Website on Blob Storage
Azure Storage allows you to host an entire static website (HTML, CSS, JavaScript, React/Vue production builds) directly from a container named `$web` without running any web servers or virtual machines!

### Step-by-Step Hands-on Walkthrough:
1. In the Azure Portal, open your Storage Account.
2. In the left navigation menu, scroll down to **Data management** → **Static website**.
3. Toggle the switch to **Enabled**.
4. Set **Index document name** to `index.html`.
5. Set **Error document path** to `404.html`.
6. Click **Save**. Azure instantly generates a public web endpoint:  
   `https://<storage-account-name>.zXX.web.core.windows.net/`
7. Click on **Containers** → open the newly generated `$web` container.
8. Upload your `index.html` file.
9. Open the web endpoint in your browser—your website is live on the internet!

---

## 8. Automating Lifecycle Management
Instead of manually moving old files to cool or archive tiers, Azure provides an automated **Lifecycle Management Rule Engine**:

```json
{
  "rules": [
    {
      "name": "ArchiveAndPurgeLogs",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "actions": {
          "baseBlob": {
            "tierToCool": { "daysAfterModificationGreaterThan": 30 },
            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },
            "delete": { "daysAfterModificationGreaterThan": 365 }
          }
        },
        "filters": {
          "blobTypes": [ "blockBlob" ],
          "prefixMatch": [ "logs/" ]
        }
      }
    }
  ]
}
```

---

## 9. Essential Azure CLI Commands for Blob Storage

### Create a Storage Account
```bash
az storage account create \
  --name mystorageak2026 \
  --resource-group my-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2
```

### Create a Container
```bash
az storage container create \
  --account-name mystorageak2026 \
  --name project-assets \
  --auth-mode login
```

### Upload a File (Blob)
```bash
az storage blob upload \
  --account-name mystorageak2026 \
  --container-name project-assets \
  --name logo.png \
  --file ./images/logo.png \
  --auth-mode login
```

### Generate a Read-Only SAS Token (Valid for 1 Hour)
```bash
az storage blob generate-sas \
  --account-name mystorageak2026 \
  --container-name project-assets \
  --name logo.png \
  --permissions r \
  --expiry $(date -u -d "1 hour" '+%Y-%m-%dT%H:%MZ') \
  --full-uri
```

---

## Summary Checklist

- [ ] I understand what an **Azure Storage Account** is and recall the naming rules (3-24 lowercase letters/numbers, globally unique).
- [ ] I know the difference between **Block Blobs** (general files), **Append Blobs** (logs), and **Page Blobs** (VM VHDs).
- [ ] I can describe the 4 access tiers (**Hot**, **Cool**, **Cold**, and **Archive**) and know that Archive requires **rehydration**.
- [ ] I understand data redundancy levels: **LRS** (1 datacenter), **ZRS** (3 zones), **GRS** (paired region), and **GZRS**.
- [ ] I understand why **Account Access Keys** must never be exposed and how **SAS Tokens** provide safe temporary delegated access.
- [ ] I can host a static website directly from the `$web` container without needing a web server.
- [ ] I understand how **Lifecycle Management rules** automatically tier and purge files to minimize storage costs.