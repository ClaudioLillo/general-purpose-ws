# general-purpose-ws

General Purpose WebSockets server, using

- Serverless Framework V4
- AWS API Gateway
- Custom Authorizer with JWT
- Typescript
- Serverless offline plugin
- SSM Parameter Store

## Setup

- Replace aws profile by yours in package.json
- Copy `configure.template.sh` to `configure.sh`, replacing your secret and aws profile
- Run `chmod +x configure.sh` to give execution permissions
- Run `./configure.sh` to create ssm parameter on aws
- Run `npm install`

## Deploy

- run `npm run deploy`
- A URL will be provided by AWS at the end of the process

## Run locally

- run `npx serverless offline`

## Authorization

- This project implements a custom authorizer attached to the connection route
- The implementation is located at authorizer.ts
- It uses jwt to validate a token against a SECRET
- The token should be provided within the connection url, as a query parameter
- Example: "ws://localhost:3001?token={YOUR_TOKEN}"
