Source Timeframe: 05:25:13 to 05:57:29

# Module 07: Identity and Access Management (IAM) & Azure RBAC

## 1. AuthN vs. AuthZ — The Foundational Theory

In modern cloud architecture, perimeter firewalls and IP filters alone cannot protect distributed cloud workloads. Security begins with **Identity** as the foundational control plane.

Identity and Access Management is governed by two fundamentally distinct processes that execute strictly in sequence:

```
[ User or Service ] ── 1. Authentication (AuthN) ──► [ Microsoft Entra ID ] ── Verified Token ──►
                                                                                               │
[ Azure Resource Manager ] ◄── 2. Authorization (AuthZ) Check ◄───────────────────────────────┘
```

1. **Authentication (AuthN) — "Who are you?":**
   - The process of validating a claimed identity through cryptographic proof or credentials.
   - Examples: Entering a username + password, completing a Multi-Factor Authentication (MFA) challenge, presenting a client certificate, or exchanging an OAuth2 JWT token.
   - *In Azure:* Handled centrally by **Microsoft Entra ID**.

2. **Authorization (AuthZ) — "What are you permitted to do?":**
   - Occurs *after* authentication succeeds. Evaluates what exact actions the confirmed identity is authorized to execute against specific target resources.
   - Examples: Can this user delete a virtual machine? Can this service write to an Azure SQL table? Can this auditor read billing invoices?
   - *In Azure:* Handled by **Azure Role-Based Access Control (Azure RBAC)** and Azure Resource Manager (ARM).

> **Golden Rule of Security:** Authentication **always precedes** Authorization. If an identity cannot verify who it is, authorization logic is never evaluated.

---

## 2. Real-World Analogy: Airport Security & Boarding Gate

To understand the difference intuitively, picture international air travel:
- **Authentication (AuthN) — Passport Control:** You approach the immigration counter and present your passport. The border control officer verifies your photo, biometrics, and security holograms to prove that you are genuinely you.
- **Authorization (AuthZ) — The Boarding Pass & Terminal Gates:** Passing immigration does not give you permission to enter the cockpit, access the private airline lounge, or board an aircraft to London if your ticket is for Tokyo. Your boarding pass dictates your exact **Role** and allowed **Scope**.
- **Managed Identity — The Airport Staff Smart Badge:** A commercial airline pilot or aircraft mechanic does not memorize 50 complex passwords to access maintenance hangars. They swipe an encrypted airport RFID badge tied directly to their job profile. The airport infrastructure authenticates and authorizes them automatically.

---

## 3. Microsoft Entra ID (Formerly Azure Active Directory)

**Microsoft Entra ID** is Microsoft's multi-tenant, cloud-native identity directory service. Unlike legacy on-premises Windows Server Active Directory (which relies on Kerberos, NTLM, and LDAP inside a private network), Entra ID is built natively for the internet using modern web identity standards: **OAuth 2.0, OpenID Connect (OIDC), and SAML 2.0**.

### The 4 Security Principals Managed by Entra ID:

| Principal Type | Definition | Real-World Cloud Example |
| :--- | :--- | :--- |
| **Users** | Individual human beings holding authenticated credentials | Developers (`alice@company.com`), Cloud Administrators, Database Auditors |
| **Groups** | Collections of multiple user accounts administered as a unit | `DevOps-Engineers`, `Data-Science-Team`, `Global-Admins` |
| **Service Principals** | Machine identities used by automated applications and software | GitHub Actions CI/CD workflows, Terraform runner bots, Jenkins pipelines |
| **Managed Identities** | Azure-managed service identities automatically bound to cloud resources | An Azure VM or App Service querying Azure Key Vault without credentials |

---

## 4. Tenant Architecture Theory

When an enterprise registers for Microsoft cloud services (Azure, Microsoft 365), Microsoft instantiates a dedicated, completely isolated **Tenant** (directory instance).

```
Microsoft Cloud Global Infrastructure
  │
  ├── Tenant: contoso.onmicrosoft.com (Contoso Corporation)
  │     ├── Users: alice@contoso.com, bob@contoso.com
  │     ├── Groups: DevOps-Engineers, Finance-Admins
  │     └── Subscriptions: Sub-Production, Sub-Development
  │
  └── Tenant: fabrikam.onmicrosoft.com (Fabrikam Logistics)
        ├── Users: charlie@fabrikam.com
        └── Subscriptions: Sub-Corporate
```

- **Tenant ID vs. Subscription ID:**
  - **Tenant ID (Directory ID):** A GUID representing your organization's identity boundary in Entra ID.
  - **Subscription ID:** A GUID representing a billing and resource container within that tenant.
  - *One Entra ID Tenant can govern multiple distinct Azure Subscriptions.*

---

## 5. Managed Identities — Eradicating Hardcoded Secrets

The number one security vulnerability in cloud engineering is **credential leakage** — developers embedding database passwords, storage keys, or client secrets inside source code, git commits, or Dockerfiles.

```javascript
// ❌ CRITICAL SECURITY VULNERABILITY: Never do this!
const connString = "DefaultEndpointsProtocol=https;AccountName=mystorage;AccountKey=AbCdEf123456...";
```

**Managed Identities** eliminate this vulnerability entirely by turning the Azure resource itself into a verified Entra ID identity.

| Dimension | System-Assigned Managed Identity | User-Assigned Managed Identity |
| :--- | :--- | :--- |
| **Lifecycle** | Strictly bound to a single Azure resource instance. If the VM is deleted, the identity is automatically deleted. | Standalone Azure resource lifecycle. Exists independently of target compute resources. |
| **Sharing** | Cannot be shared across multiple resources (1:1 relationship). | Can be shared across multiple VMs, container apps, or functions (1:Many relationship). |
| **Ideal For** | Independent single workloads (e.g., one specific VM accessing a database). | Homogeneous compute pools (e.g., 5 identical worker VMs needing the same storage permissions). |

### Runtime Authentication Flow via IMDS:
1. When a VM requests a token, it queries the local **Instance Metadata Service (IMDS)** at non-routable link-local IP `http://169.254.169.254/metadata/identity/oauth2/token`.
2. IMDS negotiates with Entra ID behind the scenes and returns a short-lived JSON Web Token (JWT).
3. The app presents this JWT to the target service (e.g., Azure Blob Storage or Key Vault).
4. Zero credentials ever exist on disk, in configuration files, or in code repositories.

---

## 6. Azure Role-Based Access Control (Azure RBAC)

Azure RBAC enforces the **Principle of Least Privilege (PoLP)** through a deterministic three-part mathematical formula:

$$\text{Role Assignment} = \text{Security Principal} + \text{Role Definition} + \text{Scope}$$

| Component | Fundamental Question | Practical Example |
| :--- | :--- | :--- |
| **1. Security Principal** | *Who receives access?* | Alice (`alice@company.com`) or group `DevOps-Engineers` |
| **2. Role Definition** | *What operations are allowed?* | `Contributor` (Create/edit/delete resources, cannot touch IAM) |
| **3. Scope** | *Where does the permission apply?* | Resource Group: `rg-ecommerce-prod` |

---

## 7. The Scope Hierarchy & Permission Inheritance

Azure organizes cloud assets into a strict four-level administrative hierarchy:

```
[1. Management Groups]  ──► Enforces governance policies across multi-subscriptions
         │
[2. Subscriptions]      ──► Billing boundary and account-level access control
         │
[3. Resource Groups]    ──► Project lifecycle boundary (recommended scope for RBAC)
         │
[4. Cloud Resources]    ──► Individual VM, Storage Account, SQL Database, Virtual Network
```

### Golden Principles of Scope Inheritance:
1. **Inheritance is Downward and Unconditional:** Assigning `Reader` at the **Subscription** scope automatically cascades `Reader` access to every Resource Group and every single Resource inside that subscription.
2. **Deny Assignments Override Allow:** If an explicit Deny Assignment is present (such as those created by Azure Blueprints), it overrides any conflicting Allow assignment.
3. **Best Practice:** Assign permissions at the **Resource Group** level. Never grant broad Subscription-level privileges unless managing cross-cutting infrastructure teams.

---

## 8. Built-In Roles vs. Data-Plane Roles

### Core Management (Control Plane) Roles:

| Role | Read | Create / Update / Delete | Grant Permissions to Others | Primary Persona |
| :--- | :---: | :---: | :---: | :--- |
| **Owner** | Yes | Yes | **Yes** | Cloud architects and department leads with total administration rights |
| **Contributor** | Yes | Yes | **No** | DevOps and software engineers managing applications and infrastructure |
| **Reader** | Yes | **No** | **No** | Security auditors, interns, and monitoring dashboards |
| **User Access Administrator** | Yes | **No** (Compute/Storage) | **Yes** | Security officers dedicated solely to granting and revoking access |

### The Control Plane vs. Data Plane Trap:
A critical concept often tested in certification exams and interviews:
- Assigning `Contributor` on a Storage Account allows a user to modify firewall rules, change access tiers, or delete the entire storage account.
- **However, `Contributor` does NOT allow the user to read or write blobs inside containers!**
- Reading and writing data inside the resource belongs to the **Data Plane**, requiring specialized data roles:
  - `Storage Blob Data Reader` / `Storage Blob Data Contributor`
  - `Key Vault Secrets User` / `Key Vault Crypto Officer`

---

## 9. Zero Trust Security & Privileged Identity Management (PIM)

Modern enterprise security enforces the **Zero Trust Architecture**:
- *Never Trust, Always Verify.*
- *Assume Breach.*
- *Verify Explicitly.*
- *Use Least Privileged Access.*

### Privileged Identity Management (PIM):
In enterprise production subscriptions, developers and administrators do not hold permanent ("standing") `Owner` or `Contributor` rights.
- Users are granted **Eligible Assignments**.
- When elevated access is needed to resolve an incident or perform a deployment, the engineer activates their role via PIM for a bounded window (e.g., 4 hours).
- PIM can enforce managerial approval, ticket number justification, and step-up MFA before granting activation.
- Once the window elapses, privileges expire automatically.

---

## 10. Practical CLI Reference: Azure RBAC & IAM

```bash
# 1. List role assignments on a specific Resource Group
az role assignment list \
  --resource-group RG-Production \
  --output table

# 2. Grant 'Contributor' access to a developer on a Resource Group
az role assignment create \
  --assignee "alice@company.com" \
  --role "Contributor" \
  --resource-group "RG-Production"

# 3. Grant 'Storage Blob Data Reader' (Data Plane) to a VM Managed Identity
az role assignment create \
  --assignee-object-id "<managed-identity-principal-id>" \
  --role "Storage Blob Data Reader" \
  --scope "/subscriptions/<sub-id>/resourceGroups/RG-Production/providers/Microsoft.Storage/storageAccounts/mystorageprod"

# 4. Revoke a role assignment
az role assignment delete \
  --assignee "alice@company.com" \
  --role "Contributor" \
  --resource-group "RG-Production"
```

---

## Summary Checklist

- [ ] I can articulate the difference between **Authentication (AuthN)** and **Authorization (AuthZ)** and know why AuthN always runs first.
- [ ] I can identify the 4 Entra ID security principals: **Users**, **Groups**, **Service Principals**, and **Managed Identities**.
- [ ] I understand how **Managed Identities** use IMDS (`169.254.169.254`) to eliminate hardcoded credentials in application code.
- [ ] I can formulate the RBAC rule: `Security Principal + Role Definition + Scope = Role Assignment`.
- [ ] I understand the 4-level scope hierarchy: **Management Groups → Subscriptions → Resource Groups → Resources**.
- [ ] I know why **Contributor** cannot read blobs without a separate **Data Plane** role like `Storage Blob Data Contributor`.
- [ ] I understand how **Privileged Identity Management (PIM)** implements Just-In-Time (JIT) access for Zero Trust security.
