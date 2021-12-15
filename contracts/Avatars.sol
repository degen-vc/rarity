// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

interface IRarity {
    function ownerOf(uint) external view returns (address);
}

interface INames {
    function summoner_to_name_id(uint _summoner) external view returns (uint id);
}

/**
 * @title Avatars
 * @dev custom adventurers avatars
 */
contract Avatars {
    IRarity immutable rarity;
    INames immutable names;

    mapping(uint256 => string) avatars;

    event AvatarSet(uint256 advanturerId, address owner, string hash);

    constructor(IRarity _rarity, INames _names) {
        rarity = _rarity;
        names = _names;
    }

    function setAvatar(uint256 _advanturerId, string memory _hash) public {
        require(rarity.ownerOf(_advanturerId) == msg.sender, 'Avatars: Not your adventurer');
        require(hasName(_advanturerId), 'Avatars: Name not set');
        require(rarity.ownerOf(_advanturerId) != address(0), 'Avatars: Revert inside');

        avatars[_advanturerId] = _hash;
        emit AvatarSet(_advanturerId, msg.sender, _hash);
    }

    function clearAvatar(uint256 _advanturerId) external {
        setAvatar(_advanturerId, '');
    }
    //TODO add admin clear avatar
    //TODO add blocked owners/blocked adventurers
    

    function hasName(uint _advanturerId) public view returns(bool) {
        return names.summoner_to_name_id(_advanturerId) > 0;
    }

}
