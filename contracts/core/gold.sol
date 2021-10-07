// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";

interface rarity {
    function level(uint) external view returns (uint);
    function getApproved(uint) external view returns (address);
    function ownerOf(uint) external view returns (address);
}

contract rarity_gold is Ownable {
    string public constant name = "Scarcity Gold";
    string public constant symbol = "SGOLD";
    uint8 public constant decimals = 18;

    uint public totalSupply = 0;

    uint8 public formulaModifier;
    
    rarity immutable rm;

    mapping(uint => mapping (uint => uint)) public allowance;
    mapping(uint => uint) public balanceOf;

    mapping(uint => uint) public claimed;

    event Transfer(uint indexed from, uint indexed to, uint amount);
    event Approval(uint indexed from, uint indexed to, uint amount);

    constructor(rarity _rarity) {
        rm = _rarity;
    }

    function wealth_by_level(uint level) public view returns (uint wealth) {
        if (formulaModifier > 1 && level > 1) return 1000e18;
        if (level > 22 && formulaModifier == 1) return 0;
        for (uint i = 1; i < level; i++) {
            wealth += (i * 1000e18) - (formulaModifier * (level - 2) * 50e18);
            if (formulaModifier > 0) return wealth;
        }
    }

    function _isApprovedOrOwner(uint _summoner) internal view returns (bool) {
        return rm.getApproved(_summoner) == msg.sender || rm.ownerOf(_summoner) == msg.sender;
    }


    function claimable(uint summoner) external view returns (uint amount) {
        require(_isApprovedOrOwner(summoner));
        uint _current_level = rm.level(summoner);
        uint _claimed_for = claimed[summoner]+1;
        for (uint i = _claimed_for; i <= _current_level; i++) {
            amount += wealth_by_level(i);
        }
    }

    function claim(uint summoner) external {
        require(_isApprovedOrOwner(summoner));
        uint _current_level = rm.level(summoner);
        uint _claimed_for = claimed[summoner]+1;
        for (uint i = _claimed_for; i <= _current_level; i++) {
            _mint(summoner, wealth_by_level(i));
        }
        claimed[summoner] = _current_level;
    }

    function _mint(uint dst, uint amount) internal {
        totalSupply += amount;
        balanceOf[dst] += amount;
        emit Transfer(dst, dst, amount);
    }

    function approve(uint from, uint spender, uint amount) external returns (bool) {
        require(_isApprovedOrOwner(from));
        allowance[from][spender] = amount;

        emit Approval(from, spender, amount);
        return true;
    }

    function transfer(uint from, uint to, uint amount) external returns (bool) {
        require(_isApprovedOrOwner(from));
        _transferTokens(from, to, amount);
        return true;
    }

    function transferFrom(uint executor, uint from, uint to, uint amount) external returns (bool) {
        require(_isApprovedOrOwner(executor));
        uint spender = executor;
        uint spenderAllowance = allowance[from][spender];

        if (spender != from && spenderAllowance != type(uint).max) {
            uint newAllowance = spenderAllowance - amount;
            allowance[from][spender] = newAllowance;

            emit Approval(from, spender, newAllowance);
        }

        _transferTokens(from, to, amount);
        return true;
    }

    function _transferTokens(uint from, uint to, uint amount) internal {
        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
    }
        
    // @dev Change formula modifier to variate gold emission. 0 for standard formula, 1 for decreasing and >1 for static emission
    function updateFormulaModifier(uint8 _formulaModifier) external onlyOwner {
        formulaModifier = _formulaModifier;
    }

}