const BigNumber = require('bignumber.js');

const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");
TonClient.useBinaryLibrary(libNode);

const utils = require('./utils');


class TonWrapper {
  constructor({ giverConfig, ...config}) {
    this.config = config;
    this.giverConfig = giverConfig;
  }
  
  /**
   * Setup TON client instance
   * @returns {Promise<void>}
   */
  async setup(keysAmount=100) {
    await this._setupTonClient();
    await this._setupKeyPairs(keysAmount);
  }
  
  async afterRunHook() {
    const tonAfterRunSleepMs = process.env.TON_AFTER_RUN_SLEEP_MS;
    
    if (tonAfterRunSleepMs === undefined) {
      if (this.config.network === 'https://net.ton.dev') {
        await utils.sleep(4000);
      } else { // Default
        await utils.sleep(100);
      }
    } else {
      await utils.sleep( parseInt(process.env.TON_AFTER_RUN_SLEEP_MS));
    }
  }
  
  async _setupTonClient() {
    this.ton = new TonClient({
      network: {
        server_address: this.config.network,
        wait_for_timeout: this.config.waitForTimeout ? this.config.waitForTimeout : 5000,
      },
      abi: {
        message_expiration_timeout: this.config.messageExpirationTimeout ? this.config.messageExpirationTimeout : 120000,
      }
    });
  }
  
  async _setupKeyPairs(keysAmount=100) {
    if (!this.config.seed) {
      const entropy = `0x${utils.genHexString(32)}`;
      
      const {
        phrase,
      } = await this.ton.crypto.mnemonic_from_entropy({
        entropy,
        word_count: 12,
      });
  
      this.config.seed = phrase;
    }

    const keysHDPaths = [...Array(keysAmount).keys()].map(i => `m/44'/396'/0'/0/${i}`);
    
    this.keys = await Promise.all(keysHDPaths.map(async (path) => {
      return this.ton.crypto.mnemonic_derive_sign_keys({
        dictionary: 1,
        wordCount: 12,
        phrase: this.config.seed,
        path,
      });
    }));
  }
  
  async getBalance(address) {
    const {
      result: [{
        balance
      }]
    } = await this.ton.net.query_collection({
      collection: 'accounts',
      filter: {
        id: { eq: address },
      },
      result: 'balance'
    });

    return new BigNumber(balance);
  }
}


module.exports = {
  TonWrapper
};
