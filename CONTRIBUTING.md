# Preparing the development environment

1. Clone the repo: `git clone https://github.com/rsmith531/online_hours_tracker.git`

2. Install dependencies: `npm i`

3. Run `. .\generateVapidKeys.ps1`

4. Create the following environment variables:
    ```bash
    # .env
    
    NUXT_PUBLIC_ENVIRONMENT=development
    
    # secret key for the sealed session cookies from nuxt-auth-utils
    NUXT_SESSION_PASSWORD=a_random_password_with_at_least_32_characters
    
    # login credentials used in api/login.post.ts
    NUXT_LOGIN_USERNAME=choose_your_username
    NUXT_LOGIN_PASSWORD=choose_your_password
    NUXT_PUBLIC_LOGIN_NAME=choose_your_name
    ```

5. Create the required TLS certificates to run as HTTPS:
   - `npx mkcert create-ca`
   - `npx mkcert create-cert --key localhost-key.pem --cert localhost.pem --domains ["localhost", "192.168.1.101"]`

6. Run the development server:
   - Local: `npm run dev`
   - Network: `npm run dev-secure`

# TODO

- [ ] address TODOs
- [x] browser devtools should only render in dev mode
- [x] configure middleware to authenticate inbound traffic
- [ ] Make sure I am using all `nuxt-secure` features
- [ ] make my APIs type-safe (with zod?)
- [ ] Use an ORM for `db.ts`
- [ ] flesh out the readme
- [ ] make the readme an "about" page with the showdown library
- [x] get a domain name from namecheap
- [x] get hosted on a VM
- [x] configure caddy to fwd traffic to this app
- [ ] check with Push API to see how to link back to webpage
- [ ] add a timeline to summarize the 24hr period
    - Start time, 8 hr mark, break periods, current time
- [x] make the notifications panel not show up when not authenticated
- [ ] download data as csv button

# Deployment
1. Using PuTTY or another SSH client, tunnel into the hosted VPS.

2. Check to make sure Caddy is running.
   ```bash
   curl http://localhost:2019/config/
   ```

3. Make sure there are SSH keys for Github.
    - Navigate to project directory.
      ```bash
      cd ~/projects/workday_tracker/
      ```
    - Confirm there is a `git_ssh_key`file and a `git_ssh_key.pub` file in the directory.
       ```bash
       ls
       ```
    - If not, [make some SSH keys for your Github account](https://community.popupsmart.com/t/how-to-clone-a-github-repository-using-ssh-on-a-linux-machine/71).

4. Make the keys available to SSH.
    ```bash
    eval `ssh-agent -s`
    ssh-add ~/projects/workday_tracker/git_ssh_key
    ```

5. Update the repo to the latest commit.
   ```bash
   git pull
   ```
6. Build the project.
    ```bash
    npm run build
    ```
7. Run the server via `pm2`.
    ```bash
    pm2 restart ecosystem.config.cjs
    ```
