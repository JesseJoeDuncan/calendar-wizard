# Hosting Calendar Wizard on a free Oracle Cloud VM

This gets the whole team a shared, always-on URL, with calendars/images stored persistently on
the VM's own disk — no database migration needed, since that's already how the app stores data.

## 1. Create the free VM (Oracle Cloud console — you do this part)

1. Sign up at [cloud.oracle.com](https://cloud.oracle.com) for an Always Free account. Oracle asks
   for a card for identity verification, but Always Free resources are never billed as long as you
   stay within the free-tier limits (this setup does).
2. In the console: **Compute → Instances → Create Instance**.
3. Image: **Ubuntu** (22.04 or newer). Shape: pick one under **Always Free-eligible** — either an
   Ampere A1 (ARM) shape with up to 4 OCPU / 24GB RAM, or a `VM.Standard.E2.1.Micro` (x86). Either
   is far more than this app needs.
4. Under **Add SSH keys**, let Oracle generate a key pair and download the private key
   (`ssh-key-*.key`) — you'll need it to connect.
5. Create the instance, then note its **public IP address** once it's running.
6. Open the ports: **Networking → Virtual Cloud Networks → (your VCN) → Security Lists →
   Default Security List → Add Ingress Rules**. Add rules for TCP ports **80** and **443**,
   source `0.0.0.0/0`. (Port 22/SSH is already open by default.)

## 2. Connect and run the setup script

```bash
chmod 400 ~/Downloads/ssh-key-*.key
ssh -i ~/Downloads/ssh-key-*.key ubuntu@<the VM's public IP>
```

Once connected:

```bash
curl -fsSL https://raw.githubusercontent.com/JesseJoeDuncan/calendar-wizard/main/deploy/setup.sh -o setup.sh
bash setup.sh
```

This installs Node and Caddy, clones the repo, builds both the client and server, and installs
(but doesn't yet start) a systemd service. It prints the remaining manual steps at the end —
filling in `server/.env`, starting the service, opening the VM's own firewall, and pointing a
hostname at it.

## 3. Getting a hostname without owning a domain

Caddy needs a real DNS hostname to get you free HTTPS (a bare IP address doesn't work with
Let's Encrypt). If you don't want to buy a domain, use
[sslip.io](https://sslip.io) — it's a free service that resolves any hostname of the form
`<your-ip-with-dashes>.sslip.io` straight to that IP, with no signup. For example if the VM's IP
is `130.61.45.12`, use `130-61-45-12.sslip.io` as the hostname in `deploy/Caddyfile`.

If you do have a real domain, just point an A record at the VM's IP and use that hostname instead.

## 4. Sharing access

Anyone with the URL and the shared password (whatever you set `AUTH_PASSWORD` to in `.env`) can
use the app — their browser will prompt for the username (`AUTH_USERNAME`, defaults to `team`) and
password once, then remember it. This is one shared login for the whole team, not individual
accounts.

## 5. Deploying future changes

After you (or I) push new commits to `main`, redeploy by SSHing in and re-running the relevant
parts of setup.sh:

```bash
cd /opt/calendar-wizard
git pull
(cd client && npm ci && npm run build)
(cd server && npm ci && npm run build)
sudo systemctl restart calendar-wizard
```
