//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IERC20Mintable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERCTOKEN is IERC20Mintable, ERC20, Ownable {

    mapping(address => bool) public rightToMint;

    constructor(string memory name_, string memory symbol_) 
    ERC20(name_, symbol_) {
        rightToMint[_msgSender()] = true;
    }

    modifier onlyMinter() {
        require(rightToMint[_msgSender()], "You cant mint and burn!");
        _;
    }

    function changeRightsToMint(address _address) external onlyOwner {
        rightToMint[_address] = !rightToMint[_address];
    }   

    function mint(address _account, uint _amount) public override onlyMinter {
        _mint(_account, _amount);
    }

    function burn(address _account, uint _amount) public override onlyMinter {
         _burn(_account, _amount);
    }
}