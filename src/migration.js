const fs = require('fs');
const BigNumber = require('bignumber.js');


class Migration {
  constructor(tonWrapper) {
    this.tonWrapper = tonWrapper;
    
    if (!fs.existsSync('migration-log.json')) {
      this._writeContent({});
    }
    
    this.history = [];
  }
  
  updateLog(historyAction) {
    const migrationLog = JSON.parse(fs.readFileSync('migration-log.json', 'utf8'));
    
    const extendedLog = {
      ...migrationLog,
      [historyAction.alias]: {
        address: historyAction.contract.address,
        name: historyAction.contract.name,
      }
    };
    
    this._writeContent(extendedLog);
  }
  
  _writeContent(content) {
    fs.writeFileSync('migration-log.json', JSON.stringify(content));
  }
  
  async getGiverBalance() {
    return this.tonWrapper.getBalance(this.tonWrapper.giverConfig.address);
  }
  
  async deploy({
                 contract,
                 constructorParams,
                 initParams,
                 initialBalance,
                 _randomNonce,
                 alias,
               }) {
    console.log(`Deploying ${contract.name}...`);
    
    const beforeDeployGiverBalance = await this.getGiverBalance();
    
    const status = await contract.deploy(
      constructorParams,
      initParams,
      initialBalance,
      _randomNonce
    );
    
    const afterDeployGiverBalance = await this.getGiverBalance();
    
    const deployCost = beforeDeployGiverBalance.minus(afterDeployGiverBalance);
    
    const historyAction = {
      alias: alias === undefined ? contract.name : alias,
      contract,
      deployCost,
      status
    };
    
    this._logHistoryAction(historyAction);
    
    this.updateHistory(historyAction);
    this.updateLog(historyAction);
  }
  
  updateHistory(action) {
    this.history.push(action);
  }
  
  logHistory() {
    console.log(`==================================== Migrations ====================================`);
    this.history.map((action, i) => {
      console.log(`Action #${i}`);
      this._logHistoryAction(action);
    });
    
    const totalCost = this.history.reduce((acc, { deployCost }) => acc.plus(deployCost), new BigNumber(0));
    
    console.log(`Total cost: ${totalCost.dividedBy(10**9)}`);
    console.log('====================================================================================');
  }
  
  _logHistoryAction(action) {
    console.log(`Deployed ${action.contract.name} (alias - ${action.alias})`);
    console.log(`Address: ${action.contract.address}`);
    console.log(`Cost: ${action.deployCost.dividedBy(10**9)}`);
    console.log(`Transaction: ${action.status.transaction.id}`);
    console.log(`Message: ${action.status.transaction.in_msg}`);
    console.log('');
  }
}


module.exports = {
  Migration,
};

