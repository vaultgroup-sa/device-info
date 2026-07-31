# Deploying device-poc to EC2

You SSH in yourself for all of this — I can't reach your instance directly. Copy/paste
the blocks below in order; send me any error output and I'll fix it.

Assumes: direct access on port 4000 (no Nginx), OS unknown so we use `nvm` (works
identically on Amazon Linux or Ubuntu, no need to know which).

## 0. Open port 4000 in the security group

AWS Console → EC2 → your instance → Security tab → click the security group → **Edit
inbound rules** → **Add rule**: Type `Custom TCP`, Port `4000`, Source `My IP` (or
`0.0.0.0/0` if you want it reachable from anywhere while testing). Save.

## 1. SSH in and install Node.js + pm2

```bash
ssh -i /path/to/your-key.pem <user>@<EC2_PUBLIC_IP>
```

(`<user>` is `ec2-user` for Amazon Linux, `ubuntu` for Ubuntu AMIs — check the box's
launch details if unsure.)

Once connected, on the EC2 box:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc || source ~/.nvm/nvm.sh
nvm install 20
node -v && npm -v          # should print v20.x

npm install -g pm2          # keeps the app running after you disconnect, restarts on crash
```

## 2. Copy the code up

**From your Mac** (not the EC2 box), in a new terminal tab:

```bash
rsync -avz --exclude 'node_modules' --exclude 'dist' \
  -e "ssh -i /path/to/your-key.pem" \
  "/Users/vishnusharma/project/Vault/device-info/device-poc/" \
  <user>@<EC2_PUBLIC_IP>:~/device-poc/
```

Important: `node_modules` is excluded on purpose. `npm install` needs to run **on the
EC2 box itself** (next step) so it downloads Linux binaries, not the macOS ones from
your laptop — Vite's `esbuild` dependency is platform-specific and won't run if copied
across.

## 3. Install, build, and start on EC2

Back in your SSH session:

```bash
cd ~/device-poc
npm install
npm install --prefix server
npm install --prefix client
npm run build --prefix client

pm2 start server/index.js --name device-poc
pm2 save
pm2 startup                 # it prints a `sudo env PATH=...` command — copy/run that once
```

`server/index.js` serves the built React app *and* the API from the same process on
port 4000, so this one pm2 process is the whole app.

## 4. Test it

From your Mac:

```bash
curl http://<EC2_PUBLIC_IP>:4000/api/health
```

Then open `http://<EC2_PUBLIC_IP>:4000` in a browser — you should see the Live
Dashboard.

Send a test ping:

```bash
curl "http://<EC2_PUBLIC_IP>:4000/api/ping?deviceId=DEV-1&status=1"
```

It should show up on the dashboard within a second or two (SSE push), and on
`http://<EC2_PUBLIC_IP>:4000/devices`.

Simulate a small device fleet against the deployed server (from your Mac):

```bash
cd "/Users/vishnusharma/project/Vault/device-info/device-poc"
node scripts/simulate-devices.js --devices=10 --base=http://<EC2_PUBLIC_IP>:4000
```

## Useful pm2 commands

```bash
pm2 logs device-poc      # tail logs
pm2 restart device-poc   # after you rsync updated code
pm2 status               # check it's running
```

## Redeploying after a code change

```bash
# from your Mac
rsync -avz --exclude 'node_modules' --exclude 'dist' -e "ssh -i /path/to/your-key.pem" \
  "/Users/vishnusharma/project/Vault/device-info/device-poc/" <user>@<EC2_PUBLIC_IP>:~/device-poc/

# then on EC2
cd ~/device-poc
npm run build --prefix client   # only needed if you changed client/ code
pm2 restart device-poc
```

## If something doesn't connect

- Double check the security group rule saved (step 0) and that you're using the
  instance's **public** IP, not the private one.
- `curl http://localhost:4000/api/health` while SSH'd into the box first — if that
  fails, it's the app, not networking.
- `pm2 logs device-poc` for stack traces.
- Rare on stock EC2 AMIs, but if the box has its own firewall: `sudo systemctl status
  firewalld` (Amazon Linux) — stop/disable it if it's active and blocking port 4000.
