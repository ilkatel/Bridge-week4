//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./interfaces/IERC20Mintable.sol";

contract Bridge is Ownable {

    event SwapInitialized(bytes32 _hash, address indexed _swapToken, address indexed _receiveToken, address indexed _to, uint256 _amount, uint256 _nonce);
    event SwapDone(bytes32 indexed _hash, address indexed _swapToken, address indexed _receiveToken, address _to, uint256 _amount, uint256 _nonce);

    bytes32 private immutable domainSeparator;
    bytes32 private otherSeparator;
    bytes32 private immutable typeHash;
    uint256 public immutable chainId;
    uint256 private nonce;
    // receiveToken => swapToken
    mapping(address => address) public bridges;
    mapping(bytes32 => bool) public transactions;

    constructor() {
        chainId = block.chainid;
        bytes32 _typeHash = keccak256("EIP712Domain(uint256 chainId,address verifyingContract)");
        domainSeparator = _buildSeparator(_typeHash, block.chainid, address(this));
        typeHash = _typeHash;
    }

    function createPair(address _receiverToken, address _swapToken) external onlyOwner {
        require(bridges[_receiverToken] == address(0), "Pair existent!");
        bridges[_receiverToken] = _swapToken;
    }   

    function setOtherSeparator(uint256 _chainId, address _verifyingContract) external onlyOwner {
        otherSeparator = _buildSeparator(typeHash, _chainId, _verifyingContract);
    }
    
    function swap(address _receiveToken, uint256 _amount) external { 
        transfer(_receiveToken, _msgSender(), _amount);
    }

    function transfer(address _receiveToken, address _to, uint256 _amount) public {
        require(_receiveToken != address(0), "Incorrect token address!");
        require(_to != address(0), "Cant transfer to zero address!");
        require(bridges[_receiveToken] != address(0), "Bridge non-existent!");
        require(_amount > 0, "Amount cant be null!");

        IERC20Mintable(bridges[_receiveToken]).burn(_msgSender(), _amount);

        bytes32 structHash = _getHash(_receiveToken, _to, _amount, nonce, domainSeparator);
        emit SwapInitialized(structHash, bridges[_receiveToken], _receiveToken, _to, _amount, nonce);

        nonce++;
    }   

    function redeem(bytes32 _hash, address _receiveToken, address _to, uint256 _amount, uint256 _nonce, bytes memory _signature) public {
        require(!transactions[_hash], "Completed transaction!");
        require(_getHash(_receiveToken, _to, _amount, _nonce, otherSeparator) == _hash, "Incorrect transaction!");

        (address _signer, ECDSA.RecoverError _error) = ECDSA.tryRecover(ECDSA.toEthSignedMessageHash(_hash), _signature);
        require(_error == ECDSA.RecoverError.NoError, "Invalid signature!");
        require(_signer == owner(), "Transaction not signed from admin!");

        transactions[_hash] = true;
        IERC20Mintable(_receiveToken).mint(_to, _amount);

        emit SwapDone(_hash, bridges[_receiveToken], _receiveToken, _to, _amount, _nonce);
    }

    function _buildSeparator(bytes32 _typeHash, uint256 _chainId, address _verifyingContract) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _typeHash,
                _chainId,
                _verifyingContract
            )
        );
    }

    function _getHash(address _receiveToken, address _to, uint256 _amount, uint256 _nonce, bytes32 _separator) internal pure returns (bytes32) {
        return keccak256(
            abi.encodePacked("\x19\x01", _separator, keccak256(abi.encode(
                keccak256("Mail(address receiveToken,address to,uint256 amount,uint256 nonce)"),
                _receiveToken,
                _to,
                _amount,
                _nonce
            )))
        );
    }
}   
