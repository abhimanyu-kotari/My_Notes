Source Timeframe: 05:25:13 to 05:57:29

# Module 07: Identity and Access Management (IAM) & Azure RBAC

## 1. What is Identity and Access Management?
In any organization, cloud security is not just about firewalls and encryption; it begins with **knowing who is accessing your systems** and **controlling precisely what they can do**.

Identity and Access Management (IAM) is governed by two fundamental concepts:
1. **Authentication (AuthN) — "Who are you?":**
   - Verifying the identity of a person, computer, or application (e.g., entering your username, password, and 6-digit MFA authenticator code).
2. **Authorization (AuthZ) — "What are you allowed to do?":**
   - Determining what actions a verified identity has permission to perform (e.g., Can you view a database? Can you delete a virtual machine? Can you spend money?).

---

## 2. Real-World Analogy: Airport Security & Boarding Pass
Think of going on an international flight:
- **Authentication (AuthN):** You show your passport at the immigration desk. The officer inspects your photo and biometric stamp to verify that you are truly you.
- **Authorization (AuthZ):** Once past passport control, you cannot wander into the airplane cockpit or enter the First Class lounge if you hold an Economy ticket. Your boarding pass defines your specific **Role** and **Scope**.
- **Managed Identity:** An airline pilot or aircraft mechanic wears a biometric RFID security badge. They do not need to memorize 50 different passwords to unlock the maintenance doors—the airport automatically recognizes their authorized role!

---

## 3. Microsoft Entra ID (Formerly Azure Active Directory)
**Microsoft Entra ID** is Microsoft’s cloud-based identity and access management service. It manages four types of **Security Principals**:

### Microsoft Entra ID Security Principals

| Security Principal Type | Definition | Real-World Cloud Example |
| :--- | :--- | :--- |
| **Users** | Individual human beings with authenticated identity credentials. | `alice@company.com`, developers, database administrators. |
| **Groups** | Collections of multiple user accounts managed together. | `DevOps-Engineers`, `Frontend-Team`, `Cloud-Admins`. |
| **Service Principals** | Machine identities used by software applications and CI/CD pipelines. | GitHub Actions deployment runners, Terraform automation bots. |
| **Managed Identities** | Azure-managed identities linked directly to cloud resources. | An Azure Virtual Machine accessing Blob Storage without hardcoding passwords. |

### Managed Identities: System-Assigned vs. User-Assigned
One of the most dangerous developer mistakes is writing database passwords or Azure Storage keys directly into application source code. **Managed Identities** completely eliminate this risk:
- **System-Assigned Managed Identity:** Tied directly to a single resource (e.g., one specific VM). When the VM is deleted, Azure automatically deletes the identity.
- **User-Assigned Managed Identity:** Created as a standalone Azure resource. Can be shared and assigned across multiple resources (e.g., 5 different VMs running the same microservice).

---

## 4. Azure Role-Based Access Control (Azure RBAC)
Azure RBAC is the authorization system used to manage access to Azure resources. Every RBAC permission is determined by a simple, elegant 3-part formula:

$$\text{Role Assignment} = \text{Security Principal} + \text{Role Definition} + \text{Scope}$$

| Component | Core Question | Real-World Example |
| :--- | :--- | :--- |
| **1. Security Principal** | *Who gets access?* | Alice (`alice@company.com`) or `DevOps-Engineers` |
| **2. Role Definition** | *What actions can they perform?* | `Contributor` (Can create & manage, but cannot grant access to others) |
| **3. Scope** | *Where does the permission apply?* | Resource Group: `rg-backend-production` |

> **Final Result:** Alice can deploy and modify resources *only* inside `rg-backend-production`. She has zero permissions to touch other resource groups or subscriptions.

---

## 5. The Scope Hierarchy & Permission Inheritance
Azure organizes resources in a strict four-level hierarchy. **Permissions are inherited downwards** from higher scopes to lower scopes:

```
[1. Management Groups]  --> Enforce organizational governance across subscriptions
         │
[2. Subscriptions]      --> Billing and access management boundary
         │
[3. Resource Groups]    --> Project lifecycle and logical resource grouping
         │
[4. Cloud Resources]    --> Individual VM, Storage Account, VNet, SQL Database
```

### Golden Rules of Inheritance:
1. **Child scopes inherit all parent permissions.** If you grant a developer the `Reader` role at the **Subscription** level, they automatically have read access to **every single Resource Group and Resource** inside that subscription.
2. **Deny assignments override allow assignments.** If an explicit deny rule is applied, it takes precedence.
3. **Best Practice:** Always grant access at the lowest feasible scope (typically at the **Resource Group** level) to enforce the Principle of Least Privilege.

---

## 6. Core Built-In Roles in Azure

| Role | Can Read? | Can Create / Update / Delete? | Can Grant Access to Others? | Use Case |
| :--- | :---: | :---: | :---: | :--- |
| **Owner** | Yes | Yes | **Yes** | Cloud administrators and team leads who need full management and permission delegation. |
| **Contributor** | Yes | Yes | **No** | Developers and DevOps engineers who need to deploy and manage infrastructure without altering security boundaries. |
| **Reader** | Yes | **No** | **No** | Auditors, interns, and monitoring dashboards that only need visibility into resource state. |
| **User Access Administrator** | Yes | **No** (Compute/Storage) | **Yes** | Security officers who only manage IAM role assignments without touching servers. |

### Specialized Data-Plane Roles:
Notice that `Contributor` on a Storage Account allows you to change firewall rules and delete the storage account, but by default does **not** allow you to read the files inside containers! To read or write blobs, Azure provides specialized data-plane roles:
- `Storage Blob Data Reader`
- `Storage Blob Data Contributor`
- `Key Vault Secrets User`

---

## 7. Step-by-Step Hands-On: Assigning a Role in Azure Portal
1. Open the **Azure Portal** (`portal.azure.com`).
2. Navigate to your target **Resource Group** (e.g., `rg-ecommerce-prod`).
3. In the left-side menu, click on **Access control (IAM)**.
4. Click on the **Role assignments** tab to inspect all users and services currently holding permissions.
5. Click **+ Add** → **Add role assignment**.
6. **Step 1 (Role):** Search for and select the desired role (e.g., `Contributor` or `Reader`). Click **Next**.
7. **Step 2 (Members):** Choose **Assign access to:**
   - *User, group, or service principal* OR *Managed identity*.
   - Click **+ Select members**, search for your team member's email, and select them. Click **Next**.
8. **Step 3 (Review + assign):** Review the principal, role, and scope summary. Click **Review + assign**. The permission activates within seconds!

---

## 8. Essential Azure CLI Commands for IAM

### List All Role Assignments for a Resource Group
```bash
az role assignment list \
  --resource-group my-rg \
  --output table
```

### Assign 'Reader' Role to a User on a Specific Resource Group
```bash
az role assignment create \
  --assignee "alice@company.com" \
  --role "Reader" \
  --resource-group "my-rg"
```

### Assign 'Storage Blob Data Contributor' Role to a Managed Identity
```bash
az role assignment create \
  --assignee-object-id "<vm-identity-principal-id>" \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/<sub-id>/resourceGroups/my-rg/providers/Microsoft.Storage/storageAccounts/mystorageaccount"
```

### Remove a Role Assignment
```bash
az role assignment delete \
  --assignee "alice@company.com" \
  --role "Reader" \
  --resource-group "my-rg"
```

---

## 9. Cloud Identity Security Best Practices

1. **Principle of Least Privilege (PoLP):** Never grant `Owner` when `Contributor` is sufficient; never grant `Contributor` when `Reader` or a scoped role is sufficient.
2. **Never Share Credentials:** Every human engineer must have their own unique Entra ID user account. Never share root administrator credentials.
3. **Use Managed Identities for Compute:** Never hardcode passwords, API keys, or storage connection strings inside application code or configuration files.
4. **Enforce Multi-Factor Authentication (MFA):** Require MFA for every administrator and developer login using Entra Conditional Access policies.
5. **Privileged Identity Management (PIM):** In enterprise environments, grant administrative access on a **Just-In-Time (JIT)** basis that automatically expires after 4 to 8 hours and requires managerial approval.

---

## Summary Checklist

- [ ] I can clearly articulate the difference between **Authentication (AuthN)** and **Authorization (AuthZ)**.
- [ ] I know the 4 security principals in **Microsoft Entra ID**: Users, Groups, Service Principals, and Managed Identities.
- [ ] I understand the difference between **System-Assigned** and **User-Assigned** Managed Identities and why they prevent credential leaks.
- [ ] I can write and explain the RBAC formula: `Security Principal + Role Definition + Scope = Role Assignment`.
- [ ] I understand the four levels of Azure scope: **Management Groups → Subscriptions → Resource Groups → Resources**, and know that permissions inherit downwards.
- [ ] I know the difference between the core built-in roles: **Owner**, **Contributor**, **Reader**, and **User Access Administrator**.
- [ ] I can explain the **Principle of Least Privilege (PoLP)** and how to assign a role in the Azure Portal or via Azure CLI.