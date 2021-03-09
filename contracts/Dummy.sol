pragma solidity >= 0.6.0;


import './interfaces/IDummy.sol';

// Dummy contract
// Used for testing imports from the Github
contract Dummy is IDummy {
    function dummy() override external view returns(uint8 answer) {
        return 123;
    }
}
