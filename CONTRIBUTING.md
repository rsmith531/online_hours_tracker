# Preparing the development environment

1. Clone the repo: `git clone git@github.com:rsmith531/online_hours_tracker.git .`

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

- [ ] figure out if I can load primevue stylesheet on server to avoid FOUC
- [ ] implement [nuxt-api-shield](https://nuxt.com/modules/api-shield)
- [ ] address TODOs
- [x] browser devtools should only render in dev mode
- [x] configure middleware to authenticate inbound traffic
- [ ] Make sure I am using all `nuxt-secure` features
- [ ] make my APIs type-safe (with [zod](https://zod.dev/?id=installation)?)
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
- [ ] write test suites

# Deployment

tl,dr to update to the latest commit:
```bash
eval `ssh-agent -s` && ssh-add ~/projects/workday_tracker/git_ssh_key && git pull && npm run build && pm2 restart ecosystem.config.cjs || echo "One or more commands failed."
```

1. Using PuTTY or another SSH client, tunnel into the hosted VPS.

2. Check to make sure Caddy is running.
   ```bash
   curl http://localhost:2019/config/
   ```

3. Make sure there are SSH keys for Github.
    - Navigate to project directory.
      ```bash
      cd ~/projects/workday_tracker/01_my_instance
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

6. If there are new packages in the project, install them.
    ```bash
    npm i
    ```

7. Build the project.
    ```bash
    npm run build
    ```
8. Run the server via `pm2`.
    ```bash
    pm2 restart ecosystem.config.cjs
    ```



## Adding a new instance

### Creating the new instance

1. Create a new directory in `~/projects/workday_tracker/`, for example `mkdir 02_demo_instance`.

2. [Clone the repo](#L3).

3. Create and [configure](#L9) a `.env` file.
    - Set `NUXT_PUBLIC_ENVIRONMENT` to `production`.

4. Follow the [remaining deployment steps](#L90).

### Reconfiguring Caddy

Here's an example Caddyfile: 

```bash
# Caddyfile

roamers.rest, *.roamers.rest {
        handle {
                @demoHost host demo.roamers.rest
                handle @demoHost {
                        reverse_proxy :3000
                }

                @lupineHost host lupine.roamers.rest
                handle @lupineHost {
                        reverse_proxy :3001
                }

                @wwwHost host www.roamers.rest
                handle @wwwHost {
                        reverse_proxy :3000
                }

                @defaultHost host roamers.rest
                handle @defaultHost {
                        reverse_proxy :3000
                }

                # Any other subdomain is aborted here.
                abort
        }

        handle_path /socket.io/* {
                @demoSocket host demo.roamers.rest
                handle @demoSocket {
                        reverse_proxy :3000
                }

                @lupineSocket host lupine.roamers.rest
                handle @lupineSocket {
                        reverse_proxy :3001
                }

                @wwwSocket host www.roamers.rest
                handle @wwwSocket {
                        reverse_proxy :3000
                }

                @defaultSocket host roamers.rest
                handle @defaultSocket {
                        reverse_proxy :3000
                }

                # Any other subdomain is aborted here.
                abort
        }
}

```

The file lives at `~/Caddyfile`, in the `root` directory of the VPS.

1. Add a case to the `handle` and `handle_path` switches for the new subdomain.

2. Run `caddy fmt --overwrite` to make sure the new file is formatted correctly.

3. Run `caddy adapt` to convert the file to Caddy's native JSON format.

3. Run `caddy reload` to reload Caddy.

### Reconfiguring pm2

Here's an example pm2 ecosytem config file: 

```javascript
// ~/ecosystem.config.cjs

module.exports = {
    apps: [
        {
            name: 'demo_workday_tracker',
            port: '3000',
            exec_mode: 'cluster',
            instances: 'max',
            script: '02_demo_instance/.output/server/index.mjs',
            error_file: '02_demo_instance/logs/error.log',
            out_file: '02_demo_instance/logs/output.log',
            merge_logs: true,
            autorestart: true
        },
        {
            name: 'lupine_workday_tracker',
            port: '3001',
            exec_mode: 'cluster',
            instances: 'max',
            script: '01_my_instance/.output/server/index.mjs',
            error_file: '01_my_instance/logs/error.log',
            out_file: '01_my_instance/logs/output.log',
            merge_logs: true,
            autorestart: true
        }
    ]
}
```

The file lives at `~/projects/workday_tracker/ecosystem.config.cjs`.

1. Add a new app object to the array with a unique `name`.

2. Set the port to an available port.

3. Change the script to the Nuxt build output in the new instance directory.

4. Update the log file paths.

