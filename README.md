# sdle-proj2 - Distributed timeline (Social Network)<!-- omit in toc -->

## Table of Contents<!-- omit in toc -->

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [Running the application](#running-the-application)
- [Testing the application](#testing-the-application)
- [Linter](#linter)
- [API](#api)
  - [DELETE /peer/remove](#delete-peerremove)
  - [DELETE /peer/stop](#delete-peerstop)
  - [DELETE /peer/unsubscribe](#delete-peerunsubscribe)
  - [GET /peer/cache](#get-peercache)
  - [GET /peer/database](#get-peerdatabase)
  - [GET /peer/feed](#get-peerfeed)
  - [GET /peer/post](#get-peerpost)
  - [GET /peer/profile](#get-peerprofile)
  - [GET /peer/status](#get-peerstatus)
  - [GET /peer/token](#get-peertoken)
  - [POST /peer/post](#post-peerpost)
  - [PUT /peer/start](#put-peerstart)
  - [PUT /peer/subscribe](#put-peersubscribe)
- [Logging](#logging)
- [Authors](#authors)
- [Project Structure and Conventions](#project-structure-and-conventions)

## Getting Started

The following instructions allow you to setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

This is an example of how to list things you need to use the software and how to install them.

* node

  ```sh
  curl -fsSL https://deb.nodesource.com/setup_17.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

* yarn (optional)

  ```sh
  npm global add yarn
  ```

### Installation

1. Clone the repo

   ```sh
   git clone https://git.fe.up.pt/sdle/2021/t3/g16/proj1.git
   ```

2. Install the project via `npm` or `yarn`

   ```sh
   # with npm
   npm install
   
   # or
   
   # with yarn
   yarn
   ```

<!-- USAGE EXAMPLES -->
## Usage

### Running the application

The next command is going to start the peer.

```sh
# with npm
npm run start <port> <username>

#or 

# with yarn
yarn start <port> <username>
```

There are two required arguments:

* port: the port to listen on the REST application
* username: the username of the peer

## Testing the application

In order to test the application you need to run the following command:

```sh
# with npm
npm run test

# or

# with yarn
yarn test
```

## Linter

To check code conventions you can use the following command:

```sh
# with npm
npm run lint

# or

# with yarn
yarn lint
```

## API

### DELETE /peer/remove

**Prerequisites**: peer is online

```sh
curl -X DELETE http://peerip:peerport/peer/remove
```

### DELETE /peer/stop

**Prerequisites**: peer is online

```sh
curl -X DELETE http://peerip:peerport/peer/stop
```

### DELETE /peer/unsubscribe

**Prerequisites**: peer is online

```sh
curl -X DELETE http://peerip:peerport/peer/unsubscribe
--header 'Content-Type: application/json' \
--data-raw '{"user":"username"}'
```

### GET /peer/cache

**Prerequisites**: peer is online

```sh
curl -X GET http://peerip:peerport/peer/cache
```

### GET /peer/database

**Prerequisites**: peer is online

```sh
curl -X GET http://peerip:peerport/peer/database
```

### GET /peer/feed

**Prerequisites**: peer is online

```sh
curl -X GET http://peerip:peerport/peer/feed
```

### GET /peer/post

**Prerequisites**: peer is online

```sh
curl -X GET http://peerip:peerport/peer/profile
--header 'Content-Type: application/json' \
--data-raw '{"id":"b25958f6-ca99-49b3-be50-c791f8658dc6username"}'
```

### GET /peer/profile

**Prerequisites**: peer is online

```sh
curl -X GET http://peerip:peerport/peer/profile
```

or

```sh
curl -X GET http://peerip:peerport/peer/profile
--header 'Content-Type: application/json' \
--data-raw '{"user":"username"}'
```

### GET /peer/status

```sh
curl -X GET http://peerip:peerport/peer/token
```

### GET /peer/token

**Prerequisites**: peer is online

```sh
curl -X GET http://peerip:peerport/peer/token
```

### POST /peer/post


**Prerequisites**: peer is online

```sh
curl -X POST http://peerip:peerport/peer/post \
--header 'Content-Type: application/json' \
--data-raw '{"message":"Hello, world!"}'
```

### PUT /peer/start

```sh
curl -X PUT http://peerip:peerport/peer/start
```

or with private key and token

```sh
curl -X PUT http://peerip:peerport/peer/start \
--header 'Content-Type: application/json' \
--data-raw '{
    "token": "/ip4/127.0.0.1/tcp/43089/p2p/QmPBAtRjWBjVE1988TZPVazNNN7JTU1hAiQXbjfaAKCDdD",
    "privateKey": "-----BEGIN PRIVATE KEY-----\n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\nA1kA43GaHRcqns0oLV+xgLmLZk6a\n-----END PRIVATE KEY-----\n"
}'
```

### PUT /peer/subscribe

**Prerequisites**: peer is online

```sh
curl -X DELETE http://peerip:peerport/peer/subscribe
--header 'Content-Type: application/json' \
--data-raw '{"user":"username"}'
```

## Logging

Every peer execution is logged into the terminal with information about the execution of the program. An example is:

```log
  tp2p:peer peer created +0ms
  tp2p:peer peer created +1ms
  tp2p:peer peer created +1ms
  tp2p:storage peer id file not found +0ms
  tp2p:storage cache file not found +1ms
  tp2p:peer peer has now started +469ms
  tp2p:storage failed to recover following list, subscriptions file is not found +2s
  tp2p:storage peer id file not found +33ms
  tp2p:storage cache file not found +0ms
  tp2p:storage peer id file not found +1ms
  tp2p:storage cache file not found +0ms
PUT /peer/start 201 1861.730 ms - 4204
GET /peer/token 200 1.368 ms - 333
```

## Authors

* Henrique Pereira (up201806538)
* Luís Tavares (up201809679)
* Márcio Duarte (up201909936)
* Ricardo Nunes (up201706860)

## Project Structure and Conventions

* Code conventions based on standard ESLint config [Standard](https://github.com/standard/eslint-config-standard);
* README template based on [Best-README-Template](https://github.com/othneildrew/Best-README-Template/blob/master/BLANK_README.md).
