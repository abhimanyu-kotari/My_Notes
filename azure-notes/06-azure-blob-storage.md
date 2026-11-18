Source Timeframe: 04:43:48 to 05:25:13

# Module 06: Azure Blob Storage — Theory, Architecture & Concepts

## 1. What is Azure Blob Storage?

Modern web, mobile, and AI applications generate vast quantities of unstructured data — images, streaming audio/video, PDF invoices, diagnostic logs, telemetry, and training datasets. Relational SQL databases are architected for structured rows and relational queries, making them ill-suited and cost-prohibitive for raw multi-gigabyte media assets.

**Azure Blob Storage** is Microsoft's massively scalable, durable, and highly available **Object Storage service**.
- The term **"BLOB"** stands for **B**inary **L**arge **OB**ject.
- It stores raw binary payloads of any file format without requiring traditional disk formatting, file allocation tables, or sector partitioning.
- Every object is universally addressable via standard HTTP/HTTPS REST endpoints.

---

## 2. Object Storage vs. Block Storage vs. File Storage

Understanding storage primitives is essential for cloud system design:

| Dimension | Object Storage (Blob) | Block Storage (Managed Disks) | File Storage (Azure Files) |
| :--- | :--- | :--- | :--- |
| **Data Organization** | Flat namespace: URI / key maps to binary payload | Raw sectors/blocks directly addressable by OS | Hierarchical folder/directory tree structure |
| **Access Protocol** | HTTP / HTTPS REST APIs (GET, PUT, DELETE) | Native OS disk drivers (SCSi / NVMe abstraction) | SMB (Server Message Block) / NFS protocols |
| **Host Coupling** | Completely decoupled; accessible globally via URL | Attached to a single VM instance at a time | Mounted concurrently across hundreds of client VMs |
| **Primary Use Cases** | Media assets, AI training sets, backups, static websites | Virtual Machine OS disks, relational database storage | Shared legacy filesystems, shared enterprise assets |

---

## 3. Storage Account Hierarchy & Structure

```
https://<storage-account-name>.blob.core.windows.net/<container-name>/<blob-name>

Example:
https://mystorageprod2026.blob.core.windows.net/user-photos/avatar-1024.jpg
        ▲                                      ▲           ▲
        │                                      │           │
 Storage Account Namespace                 Container    Blob File
```

### The Amazon Fulfillment Warehouse Analogy:
- **Storage Account:** The entire Amazon distribution center with a global address and security checkpoint.
- **Container:** An organized storage aisle or bin inside the warehouse (e.g., `user-photos`, `invoices`, `$web`).
- **Blob:** The individual packaged parcel sitting on the shelf (e.g., `avatar-1024.jpg`).

### Storage Account Naming Rules (Exam & Interview Essential):
1. Length must be between **3 and 24 characters**.
2. Only **lowercase alphanumeric characters** are permitted (no hyphens, underscores, spaces, or uppercase characters).
3. Must be **globally unique across all of Microsoft Azure**, as it establishes a public DNS subdomain:  
   `https://<name>.blob.core.windows.net/`

---

## 4. The Three Types of Blobs

| Blob Type | Internal Structure | Maximum Size | Primary Workloads |
| :--- | :--- | :--- | :--- |
| **Block Blobs** | Assembled from discrete blocks (up to 4,000 MiB each) committed in parallel | ~190.7 TB | Images, documents, video streaming, backups — standard default |
| **Append Blobs** | Optimized solely for append operations; existing blocks cannot be altered | ~195 GB | Continuous system event logs, audit trails, IoT sensor streams |
| **Page Blobs** | Collection of 512-byte aligned pages providing random read and write capability | 8 TB | Azure Virtual Machine VHD OS disks, database write-ahead logs |

---

## 5. Blob Storage Access Tiers & The Rehydration Process

To balance cost efficiency against data retrieval latency, Azure provides four lifecycle access tiers:

| Tier | Storage Cost | Data Retrieval Fee | Minimum Retention | Availability SLA | Typical Usage |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Hot** | Highest | Lowest / None | None | 99.9% | Actively accessed production data and live web assets |
| **Cool** | Moderate | Low | 30 days | 99.0% | Infrequently accessed data (viewed at most once per month) |
| **Cold** | Low | Moderate | 90 days | 99.0% | Rarely accessed data (accessed only a few times per year) |
| **Archive** | Lowest | Highest | 180 days | Offline | Long-term compliance records, legal backups, deep archives |

### Archive Tier Rehydration:
- Archived blobs are taken offline and stored on high-density cold media.
- An archived blob cannot be read, downloaded, or shared via URL directly.
- It must first be **rehydrated** (copied or transitioned) back into the Hot or Cool tier.
- **Standard Priority Rehydration:** Requires between **1 to 15 hours**.
- **High Priority Rehydration:** Completes in **under 1 hour** (for objects < 10 GB), but carries premium retrieval pricing.

---

## 6. Data Redundancy & High Availability

Azure protects data from hardware degradation, power failures, and catastrophic regional outages by automatically retaining multiple synchronous and asynchronous copies:

```
Failure Scope Hierarchy:
  Disk / Server Failure      ──► Handled by ALL redundancy options
  Datacenter Power/Fire Loss ──► Handled by ZRS, GRS, GZRS
  Regional Catastrophe       ──► Handled by GRS and GZRS
```

| Strategy | Scope of Copies | Target Durability (Annual) | Failure Tolerance |
| :--- | :--- | :---: | :--- |
| **LRS (Locally Redundant)** | 3 copies within one datacenter | 11 nines (99.999999999%) | Protects against individual server rack or disk loss |
| **ZRS (Zone-Redundant)** | 3 copies distributed across 3 distinct Availability Zones | 12 nines (99.9999999999%) | Survives complete failure of an entire datacenter facility |
| **GRS (Geo-Redundant)** | 3 copies in Primary region (LRS) + 3 copies replicated asynchronously to Paired Secondary region | 16 nines (99.99999999999999%) | Protects against regional natural disasters or widespread outages |
| **GZRS (Geo-Zone-Redundant)** | 3 copies across 3 zones in Primary (ZRS) + 3 copies replicated to Secondary region | 16 nines (99.99999999999999%) | Maximum tier: enterprise zone resilience plus regional disaster protection |

> **Read-Access Variants (RA-GRS & RA-GZRS):** Standard GRS replicates data to the secondary paired region, but that replica remains unreadable unless Microsoft initiates an official region failover. RA-GRS provides a dedicated read-only endpoint (`<account>-secondary.blob.core.windows.net`), enabling read availability even during an active primary region outage.

---

## 7. Storage Security: Access Keys vs. SAS Tokens vs. Entra ID

| Mechanism | Risk Level | Scope & Capabilities | Best Practice Guideline |
| :--- | :---: | :--- | :--- |
| **Account Access Keys (Key 1 & Key 2)** | 🚨 Critical (Root) | Grants full unrestricted administrative access to the entire storage account | Never commit into source code or share with clients. Store strictly in Azure Key Vault. |
| **Shared Access Signatures (SAS)** | 🛡️ Delegated | Provides time-bounded, permission-scoped access to a specific container or blob | Best for client file uploads, time-limited download links, and third-party apps. |
| **Microsoft Entra ID (RBAC)** | 🔒 Industry Standard | Identity-based access controlled via Azure Role-Based Access Control | Mandatory best practice for production apps, VMs, and managed services. |

### Cryptographic Anatomy of a SAS URL:
```
https://mystorage.blob.core.windows.net/assets/spec.pdf
  ?sv=2023-01-03        # Storage API version
  &ss=b                 # Signed Services: b = blob
  &srt=o                # Signed Resource Types: o = object
  &sp=r                 # Permissions: r = read only (no write/delete)
  &se=2026-11-18T18:00Z # Signature Expiration: access terminates strictly at this timestamp
  &sip=198.51.100.10    # Allowed Source IP address restriction (optional)
  &spr=https            # Protocol restriction: HTTPS only
  &sig=d8A...k9Q%3D     # Cryptographic HMAC-SHA256 signature generated with Account Key
```
If an adversary tampers with any parameter in the URL (such as extending the expiration time `se` or altering permissions `sp`), the signature verification fails instantly and Azure returns `403 Forbidden`.

---

## 8. Serverless Static Website Hosting & Lifecycle Automation

### Static Website Hosting:
By enabling **Static Website** hosting, Azure automatically provisions a reserved root container named `$web`. Uploading HTML, CSS, JavaScript, and client-side web builds (React, Angular, Vue) allows Azure to serve the application globally via an optimized HTTP/HTTPS endpoint:
`https://<storage-account-name>.zXX.web.core.windows.net/`

### Automated Lifecycle Rules:
Instead of manual scripts to monitor and migrate aged data, Storage Lifecycle Management rules execute automated JSON policies daily:

```json
{
  "rules": [
    {
      "name": "ArchiveAndPurgeTelemetry",
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

## 9. Practical CLI Reference: Azure Blob Storage

```bash
# 1. Create a Storage Account
az storage account create \
  --name mystoragedemo2026 \
  --resource-group RG-StorageDemo \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# 2. Create a Container
az storage container create \
  --account-name mystoragedemo2026 \
  --name media-uploads \
  --auth-mode login

# 3. Upload a Blob
az storage blob upload \
  --account-name mystoragedemo2026 \
  --container-name media-uploads \
  --name diagram.png \
  --file ./diagram.png \
  --auth-mode login

# 4. Generate a Time-Limited Read-Only SAS Token (1 hour validity)
az storage blob generate-sas \
  --account-name mystoragedemo2026 \
  --container-name media-uploads \
  --name diagram.png \
  --permissions r \
  --expiry $(date -u -d "1 hour" '+%Y-%m-%dT%H:%MZ') \
  --full-uri
```

---

## Summary Checklist

- [ ] I can articulate the fundamental differences between **Object Storage**, **Block Storage**, and **File Storage**.
- [ ] I know the naming rules for an **Azure Storage Account** (3–24 characters, lowercase alphanumeric only, globally unique).
- [ ] I can distinguish between **Block Blobs** (files/media), **Append Blobs** (logs), and **Page Blobs** (VM disks).
- [ ] I understand the 4 access tiers (**Hot**, **Cool**, **Cold**, **Archive**) and know how **rehydration** works.
- [ ] I can evaluate redundancy tradeoffs: **LRS** (1 datacenter), **ZRS** (3 zones), **GRS** (paired region), and **GZRS**.
- [ ] I understand how **SAS tokens** delegate secure, tamper-proof, time-bounded access without revealing root account keys.
- [ ] I understand how the **$web** container hosts serverless static web applications.
