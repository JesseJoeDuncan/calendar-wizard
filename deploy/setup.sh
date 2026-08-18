#!/usr/bin/env bash
# One-time provisioning script for a fresh Oracle Cloud "Always Free" Ubuntu VM.
# Run this over SSH as the default (sudo-capable) user, e.g. `ubuntu`:
#   bash setup.sh
set -euo pipefail

REPO_URL="https://github.com/JesseJoeDuncan/calendar-wizard.git"
APP_DIR="/opt/calendar-wizard"

echo "== Installing Node.js 20 =="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git

echo "== Installing Caddy (automatic HTTPS reverse proxy) =="
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy

echo "== Cloning app to $APP_DIR =="
sudo mkdir -p "$APP_DIR"
sudo chown "$USER":"$USER" "$APP_DIR"
if [ -d "$APP_DIR/.git" ]; then
  (cd "$APP_DIR" && git pull)
else
  git clone "$REPO_URL" "$APP_DIR"
fi

echo "== Building client =="
(cd "$APP_DIR/client" && npm ci && npm run build)

echo "== Building server =="
(cd "$APP_DIR/server" && npm ci && npm run build)

if [ ! -f "$APP_DIR/server/.env" ]; then
  cp "$APP_DIR/server/.env.example" "$APP_DIR/server/.env"
  echo ">> Created server/.env from the example."
fi

echo "== Installing systemd service =="
sudo cp "$APP_DIR/deploy/calendar-wizard.service" /etc/systemd/system/calendar-wizard.service
sudo sed -i "s#/opt/calendar-wizard#$APP_DIR#g" /etc/systemd/system/calendar-wizard.service
sudo sed -i "s#User=.*#User=$USER#" /etc/systemd/system/calendar-wizard.service
sudo systemctl daemon-reload
sudo systemctl enable calendar-wizard

cat <<EOF

== Setup done. Remaining manual steps: ==

1. Edit $APP_DIR/server/.env — fill in your real API keys and set AUTH_PASSWORD.

2. Start the app:
     sudo systemctl start calendar-wizard
     sudo systemctl status calendar-wizard   # should say "active (running)"

3. Allow web traffic through Ubuntu's own firewall (Oracle images block this by
   default even after you open the port in the Oracle console's Security List):
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
     sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
     sudo netfilter-persistent save || sudo apt-get install -y iptables-persistent
   If "-I INPUT 6" doesn't look right for your rule set, run
   "sudo iptables -L INPUT -n --line-numbers" first and insert ACCEPT rules for
   80/443 above whatever REJECT/DROP rule comes last.

4. Point a hostname at this VM's public IP (see deploy/README.md for a free
   option if you don't own a domain), then edit deploy/Caddyfile with that
   hostname and run:
     sudo cp $APP_DIR/deploy/Caddyfile /etc/caddy/Caddyfile
     sudo systemctl reload caddy

EOF
