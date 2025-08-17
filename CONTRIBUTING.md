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

    # for the socket.io transmissions to stay siloed in its own project instance
    NUXT_PUBLIC_SOCKET_NAMESPACE=/dev

    # drizzle orm
    NUXT_DB_FILE_NAME=workday_data.sqlite
    ```

5. Create the required TLS certificates to run as HTTPS:
   - `npx mkcert create-ca`
   - `npx mkcert create-cert --key localhost-key.pem --cert localhost.pem --domains ["localhost", "192.168.1.101"]`

6. Run the development server:
   - Local: `npm run dev`
   - Network: `npm run dev-secure`

# Deployment

For first time deployments, the Docker container will run the Nuxt app and create the sqlite file in the container's volume. This will be an empty database that needs the schema applied. To do that: 

1. Run `docker exec online_hours_tracker npm i drizzle-kit`.

2. Run `docker exec online_hours_tracker npx drizzle-kit push`.