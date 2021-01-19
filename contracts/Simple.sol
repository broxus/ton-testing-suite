pragma solidity >= 0.6.0;
pragma AbiHeader expire;
pragma AbiHeader pubkey;


contract Simple {
    uint16 static _randomNonce;

    uint state;

    event StateChange(uint _state);

    constructor(uint _state) public {
        tvm.accept();

        setState(_state);
    }

    function setState(uint _state) public {
        tvm.accept();
        state = _state;

        emit StateChange(_state);
    }

    function getDetails()
        public
        view
    returns (
        uint _state
    ) {
        tvm.accept();

        return state;
    }
}
