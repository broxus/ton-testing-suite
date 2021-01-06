# TON testing suite

Set of tools for making testing smart contracts on TON easier.

## Installation

```
npm install --save ton-testing-suite
```

## Project structure

We recommend to use the following structure in root of your project.

```
migration/
test/
contracts/
build/
```

### Compiling contracts

The testing suite is searching the ABI and base64 TVC in the build folder. You can compile it yourself of use the [compile.js](./compile.js) script. It requires

- `tvm_linker` available binary ([source](https://github.com/tonlabs/TVM-linker))
- `solc-ton` available binary ([source](https://github.com/tonlabs/TON-Solidity-Compiler/))
- `build` folder is available

To compile the contracts, run the `node compile.js`.

## Configuring TON

To start working with testing suite, you should specify seed for keys derivation and network.

```javascript
const freeton = require('ton-testing-suite');

const tonWrapper = new freeton.TonWrapper({
  network: 'https://net.ton.dev',
  seed: 'regret neutral ... sand',
});

(async() => {
  await tonWrapper.setup();
})();
```

### Giver configuration

The process of deploying contracts in TON differs from the Ethereum's.
Since there's no EOA accounts, someone should pay for deployment. For this reason, giver contract is used.
Giver contract should implement the `sendGrams(address dest, uint64 amount) public pure` method.
Testing suite will call it each time the `deploy` is used.
The example is bellow:

```solidity
pragma solidity >= 0.6.0;
pragma AbiHeader expire;

contract Giver {
    constructor() public {
        tvm.accept();
    }

    function sendGrams(address dest, uint64 amount) public pure {
        tvm.accept();
        require(address(this).balance > amount, 60);
        dest.transfer(amount, false, 1);
    }
}
```

After the Giver contract is deployed and have TON on it - pass it's address and ABI to the `TonWrapper` configuration.
Example bellow is given for a [local TON node](https://hub.docker.com/r/tonlabs/local-node) - it has a pre-deployed Giver.

```javascript
const freeton = require('ton-testing-suite');

const giverConfig = {
  address: '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94',
  abi: { "ABI version": 1, "functions": [ { "name": "constructor", "inputs": [], "outputs": [] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [] } ], "events": [], "data": [] },
};

const tonWrapper = new freeton.TonWrapper({
  network: 'http://localhost',
  seed: 'regret neutral ... sand',
  giverConfig
});

(async() => {
  await tonWrapper.setup();
})();
```

## Running migrations

Migration is the process of deploying contracts to the network and performing initial setup before tests.
Here's an example of deploying single contract with constructor and init params.

```javascript
(async () => {
  await tonWrapper.setup();
  
  tonWrapper.keys.map((key, i) => console.log(`Key #${i} - ${JSON.stringify(key)}`));

  const migration = new freeton.Migration(tonWrapper);
  
  // Contract named 'Example.sol' in the 'contracts' folder
  const Example = await freeton
    .requireContract(tonWrapper, 'Example');
  
  // - Deploy Bridge
  await migration.deploy({
    contract: Example,
    constructorParams: {
      firstParam: 123,
      secondParams: true,
    },
    initParams: {
      thirdParam: 123123,
    },
    initialBalance: utils.convertCrystal('10', 'nano'),
    _randomNonce: true,
  }).catch(e => console.log(e));

  migration.logHistory();
  
  process.exit(0);
})();
```

### Using `_randomNonce`

In TON, contract address is derived from the contract code, `initParams` and signer key.
As you see there's no nonce as in Ethereum. It means, that deploying the same contract with the same params
will result in an error, because of already used address. To bypass this, add special initial param to your contract:

```solidity
contract Example {
    uint static _randomNonce;
}
```

And specify `_randomNonce: true`, so testing suit will automatically pass the random number to it.

Migration details will be saved in the `migration-log.json`.

## Running tests

We recommend to use mocha for your tests. Save your tests in the `test` folder. Here's a test example:

```javascript
const { expect } = require('chai');
const freeton = require('ton-testing-suite');

let Example;

const tonWrapper = new freeton.TonWrapper({
  network: 'http://localhost',
  seed: '....',
});


describe('Test event configurations', function() {
  this.timeout(12000000);

  before(async function() {
    await tonWrapper.setup();

    Example = await freeton
      .requireContract(tonWrapper, 'Example');
    await Example.loadMigration();
  
    console.log(`Example address: ${Example.address}`);
  });

    it('Check initial state', async function() {
      await Bridge.run('updateStatus', {
        status: true,
      });

      const {
        status,
      } = await Bridge.runLocal('getStatus', {});
    
      expect(status).to.equal(false, 'Wrong status');
    });
});

```

