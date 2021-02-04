const freeton = require('./../src');
const { expect } = require('chai');
const logger = require('mocha-logger');


const ton = new freeton.TonWrapper({
  giverConfig: {
    abi: { "ABI version": 1, "functions": [ { "name": "constructor", "inputs": [], "outputs": [] }, { "name": "sendGrams", "inputs": [ {"name":"dest","type":"address"}, {"name":"amount","type":"uint64"} ], "outputs": [] } ], "events": [], "data": [] },
    address: '0:841288ed3b55d9cdafa806807f02a0ae0c169aa5edfe88a789a6482429756a94',
  },
  network: 'http://localhost',
  seed: "melody clarify hand pause kit economy bind behind grid witness cheap tomorrow",
  debug: true,
});


let SimpleContract;


describe('Test TON testing suite', async function() {
  this.timeout(12000000);

  describe('Contracts', async function() {
    it('Setup', async function() {
      await ton.setup(10);
      
      expect(ton.keys).to.have.lengthOf(10, 'Wrong keys amount');
    });
  
    it('Load contract', async function() {
      SimpleContract = await freeton.requireContract(ton, 'Simple');
      
      expect(SimpleContract.address).to.equal(undefined, 'Address should be undefined');
      expect(SimpleContract.code).not.to.equal(undefined, 'Code should be available');
      expect(SimpleContract.abi).not.to.equal(undefined, 'ABI should be available');
    });
    
    it('Get future address', async function() {
      const address = await SimpleContract.getFutureAddress({
        constructorParams: {
          _state: 123
        },
        initParams: {
          _randomNonce: 123,
        },
      });

      expect(address).to.be.a('string').and.satisfy(s => s.startsWith('0:'), 'Bad future address');
    });

    it('Deploy contract', async function() {
      await SimpleContract.deploy({
        constructorParams: {
          _state: 123
        },
        initParams: {},
        _randomNonce: true,
        initialBalance: freeton.utils.convertCrystal('10', 'nano')
      });
  
      expect(SimpleContract.address).to.be.a('string').and.satisfy(s => s.startsWith('0:'), 'Bad deployed address');

      logger.success(`Contract address: ${SimpleContract.address}`);
    });
    
    it('Call contract method', async function() {
      await SimpleContract.run('setState', {
        _state: 111,
      });
    });
  
    it('Run function method', async function() {
     const response = await SimpleContract.runLocal('getDetails', {});

     logger.log(`Run result: ${response}`);
     
     expect(response.toNumber()).to.be.equal(111, 'Wrong state');
    });
  });

  describe('GraphQL', async function() {
    it('Get balance', async function() {
      const balance = await SimpleContract.tonWrapper.getBalance(SimpleContract.address);

      expect(balance.toNumber()).to.be.greaterThan(9, 'Balance to low');
      
      logger.log(`Contract balance: ${balance.dividedBy(10**9).toFormat(9)}`);
    });
    
    it('Get events', async function() {
      const events = await SimpleContract.getEvents('StateChange');
      
      expect(events).to.have.lengthOf(2, 'Wrong events amount emitted');
    });
  });
  
  describe('Random mnemonic', async function () {
    it('Test random mnemonic derivation', async function() {
      const ton1 = new freeton.TonWrapper({
        network: 'http://localhost',
      });

      const ton2 = new freeton.TonWrapper({
        network: 'http://localhost',
      });
      
      await ton1.setup();
      await ton2.setup();
      
      expect(ton1.config.seed).to.not.equal(ton2.config.seed, 'Same random mnemonics');
    });
  });
});
