Source Timeframe: 03:49:20 to 03:56:53

# Module 03: Docker & Containerization — Deep Theory

## 1. The Classic Developer Nightmare: "It Works on My Machine!"

Every software engineer eventually hits this wall: code runs perfectly on their laptop but crashes immediately in production. The root cause is **Environment Drift** — the cumulative difference between the developer's local machine and any other machine that runs the code.

**Common drift causes:**
- Python 3.11 locally vs Python 3.8 in production
- macOS has `libssl` v3.0 baked in; Linux server has v1.1
- Locally-set environment variables (`DATABASE_URL`) not present on server
- Compiled C extensions built for macOS ARM64, deployed to x86-64 Linux

**Docker's answer:** Stop shipping code. Ship *environments*. Package the application code, the exact runtime version, system libraries, OS user-space, and configuration into a single immutable binary artifact — a Container Image. If it runs in one environment, it runs identically everywhere.

---

## 2. Linux Kernel Isolation Theory: Namespaces & cgroups

Containers are **not virtual machines**. They are not a Docker invention. They are a composition of two Linux kernel features that have existed since 2002 (namespaces) and 2007 (cgroups). Docker simply made these kernel features usable with simple commands.

### Linux Namespaces (Process Isolation)

A namespace is a Linux kernel feature that wraps a global system resource and makes it appear as if each process has its own isolated instance of that resource.

| Namespace | What It Isolates |
| :--- | :--- |
| `pid` | Process IDs — container's PID 1 is independent of host |
| `net` | Network stack (interfaces, routing tables, ports) |
| `mnt` | Mount points and file system hierarchy |
| `uts` | Hostname and domain name |
| `user` | User and group IDs (UID/GID remapping) |

### cgroups (Control Groups — Resource Limiting)

cgroups (control groups) limits, accounts for, and isolates the *resource usage* of a collection of processes.

| Resource | What cgroups Controls |
| :--- | :--- |
| CPU | Max CPU cycles a container process can consume |
| Memory | RAM limit; OOM killer terminates container if exceeded |
| Block I/O | Disk read/write throughput throttling |
| Network | Bandwidth limits on the container's virtual NIC |

> **Key Insight:** When you run `docker run --memory=512m --cpus=1`, Docker translates this into cgroup configuration. When you expose a port with `-p 80:8080`, Docker creates a network namespace and sets up iptables NAT rules automatically.

**Why containers are NOT full isolation like VMs:** All containers on the same host share the *same Linux kernel*. If a kernel exploit is found, all containers on the host are potentially compromised. VMs have hypervisor-enforced hardware-level isolation between them.

---

## 3. Virtual Machines vs. Docker Containers

| Attribute | Virtual Machine | Docker Container |
| :--- | :--- | :--- |
| OS Kernel | Full guest kernel per VM (10–30 GB) | Shares host kernel (50 MB–500 MB) |
| Start Time | Minutes (boot virtual motherboard + OS) | Milliseconds (fork a new process) |
| Density | 5–20 VMs per physical server | Hundreds of containers per host |
| Security Boundary | Strong — hypervisor hardware-level isolation | Moderate — kernel sharing means kernel exploit = all containers compromised |
| Portability | Tied to hypervisor format (VHD, VMDK) | 100% write-once, run-anywhere on any Docker host |

### Real-World Analogy: Houses vs. Shipping Containers

- **VMs (Houses):** Every house needs its own foundation, roof, plumbing, and electricity. 10 houses = 10 complete structures.
- **Containers (Shipping Containers):** Standardized steel containers — the crane and ship don't care what's inside. Stack 5,000 on one ship, move seamlessly from ship to rail to truck.

---

## 4. The 4 Core Docker Pillars (Build → Ship → Run)

```
[ Dockerfile ] ── docker build ──► [ Docker Image ] ── docker run ──► [ Running Container ]
(Source Blueprint)                   (Immutable Snapshot)                (Isolated Process)
                                             │
                                        docker push
                                             ▼
                                   [ Container Registry ]
                                   (Docker Hub / Azure ACR)
```

1. **Dockerfile:** Plaintext recipe with step-by-step build instructions (FROM, COPY, RUN, CMD).
2. **Docker Image:** Read-only, immutable binary artifact — all layers baked in. Think: *recipe card*.
3. **Docker Container:** A running live instance of an image. Think: *the dish cooked from the recipe*. 50 containers can run from 1 image simultaneously.
4. **Container Registry:** Centralized cloud library for storing and distributing images (Docker Hub = public; Azure Container Registry / ACR = private enterprise).

---

## 5. Image Layers & the Union File System

A Docker Image is a **stack of read-only layers**, not a single blob. Each Dockerfile instruction creates one layer. This is managed by **OverlayFS** (Union File System) on modern Linux systems.

```
Layer 0 (Base): FROM python:3.11-slim     → ~45 MB (Python runtime + Debian slim)
Layer 1: RUN pip install flask           → ~8 MB  (Flask + Werkzeug + Jinja2)
Layer 2: RUN pip install gunicorn        → ~1 MB  (Gunicorn WSGI server)
Layer 3: COPY requirements.txt .         → ~2 KB
Layer 4: COPY . .                        → ~500 KB (Application source code)
─────────────────────────────────────────────────────
Total Image: ~55 MB  (vs a full Ubuntu VM: ~1 GB+)
```

**Build Cache Efficiency:** If you change only your app source code (Layer 4), Docker reuses all previous layers (0–3) from cache. This is why the best practice is to `COPY requirements.txt .` and `RUN pip install` *before* `COPY . .` — dependencies change rarely; code changes frequently.

---

## 6. Anatomy of a Real Dockerfile — Line by Line

```dockerfile
# 1. Base Image — the foundation everything builds on
FROM python:3.11-slim

# 2. Working directory inside the container's isolated filesystem
WORKDIR /app

# 3. Copy dependency manifest FIRST (exploits build cache)
COPY requirements.txt .

# 4. Install inside the image (not on your host machine!)
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copy application source code (changes frequently)
COPY . .

# 6. Document which port the app listens on (metadata only — does NOT publish it)
EXPOSE 8000

# 7. Default command when container starts
CMD ["python", "app.py"]
```

| Instruction | Creates New Layer? |
| :--- | :--- |
| FROM | Yes |
| WORKDIR | Yes |
| RUN | Yes |
| COPY | Yes |
| EXPOSE | No (metadata only) |
| CMD | No (metadata only) |

---

## 7. Port Forwarding — Host ↔ Container Networking Theory

By default, every container lives inside its own private `net` namespace — isolated from the host and other containers. The `-p HOST:CONTAINER` flag creates an iptables NAT DNAT rule:

```
User: http://localhost:80
      │
      ▼ (Host eth0)
[ Host Port :80 ]
      │
      ▼ Docker iptables rule: DNAT :80 → 172.17.0.2:8000
[ Container Virtual NIC — net namespace ]
      │
      ▼
[ App Process listening on :8000 ]
```

---

## 8. Essential Docker CLI Cheatsheet

```bash
# Build & Images
docker build -t myapp:1.0 .
docker images
docker rmi myapp:1.0

# Run & Manage
docker run -d -p 80:8000 --name site myapp:1.0
docker ps          # running only
docker ps -a       # all containers
docker stop site && docker rm site

# Debug & Inspect
docker logs -f site        # live streaming logs
docker exec -it site bash  # shell inside container
docker inspect site        # full JSON metadata
docker stats               # live CPU/memory usage
```

---

## Summary Checklist

- [ ] I can explain **Environment Drift** and why Docker was invented to solve it.
- [ ] I know containers use **Linux namespaces** (isolation) and **cgroups** (resource limiting) — not full hardware virtualization.
- [ ] I understand the 4 Docker pillars: **Dockerfile → Image → Container → Registry**.
- [ ] I understand how **OverlayFS** stacks read-only image layers and why build cache depends on instruction order.
- [ ] I understand **port forwarding** (`-p HOST:CONTAINER`) and how Docker uses iptables NAT rules under the hood.
- [ ] I know Docker on Windows/macOS requires a lightweight Linux VM (WSL2/HyperKit) because containers share the Linux kernel.
