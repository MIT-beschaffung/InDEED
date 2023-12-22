pragma solidity ^0.6.11;

contract LoggingRegistry {
  event Registered(uint256 hash, address sender);  function register(uint256 hash) public {
    emit Registered(hash, msg.sender);
  }
}
