# sdle-proj2 - Distributed timeline (Social Network)

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

TODO: add API documentation

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
