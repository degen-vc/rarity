// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./Base64.sol";

interface rarity_manifested {
    function getApproved(uint) external view returns (address);
    function ownerOf(uint) external view returns (address);
    function level(uint) external view returns (uint);
    function class(uint) external view returns (uint);
    function classes(uint id) external pure returns (string memory);
}

contract NamesV3 is Ownable {
  using SafeERC20 for IERC20;

  uint256 public next_name_id = 1;

  rarity_manifested immutable rm;
  
  IERC20 public buyToken;  
  uint256 public buyTokenPrice;
  // after finalized = true, buyToken and buyTokenPrice can't be updated by owner
  bool public finalized;

  mapping(uint256 => uint256) public summoner_to_name_id; // summoner => nameId
  mapping(uint256 => string) public names;  // nameId => name
  mapping(uint256 => uint256) public name_id_to_summoner; // nameId => summoner
  mapping(string => bool) private _is_name_claimed;

  event NameClaimed(address indexed owner, uint256 indexed summoner, string name, uint256 name_id);
  event NameUpdated(uint256 indexed name_id, string old_name, string new_name);

  constructor(
    rarity_manifested _rarity_manifested, 
    IERC20 _buyToken,
    uint256 _buyTokenPrice
  ) {
    rm = _rarity_manifested;
    buyToken = _buyToken;
    buyTokenPrice = _buyTokenPrice;
  }

  modifier checkFinalized {
    require(!finalized, "Finalized!");
    _;
  }

  // --- External Mutative Functions ---

  // @dev Claim a name for a summoner. User must have approved required buyToken
  function claim (string memory name, uint256 summoner) external returns (uint256 name_id) {
    require(_isApprovedOrOwner(summoner), '!owner');
    require(validate_name(name), 'invalid name');
    string memory lower_name = to_lower(name);
    require(!_is_name_claimed[lower_name], 'name taken');
    
    buyToken.safeTransferFrom(msg.sender, address(this), buyTokenPrice);

    name_id = next_name_id;
    next_name_id++;
    names[name_id] = name;
    _is_name_claimed[lower_name] = true;
    
    summoner_to_name_id[summoner] = name_id;
    name_id_to_summoner[name_id] = summoner;

    emit NameClaimed(msg.sender, summoner, name, name_id);
  }

  // @dev Change the capitalization (as it is unique).
  //      Can't change the name.
  function update_capitalization(uint256 name_id, string memory new_name) public {
    require(_isApprovedOrOwnerOfName(name_id), "!owner or approved name");
    require(validate_name(new_name), 'invalid name');
    string memory name = names[name_id];
    require(keccak256(abi.encodePacked(to_lower(name))) == keccak256(abi.encodePacked(to_lower(new_name))), 'name different');
    names[name_id] = new_name;
    emit NameUpdated(name_id, name, new_name);
  }

  // --- External View Functions ---

  function summoner_name(uint256 summoner) public view returns (string memory name){
    name = names[summoner_to_name_id[summoner]];
  }

  function is_name_claimed(string memory name) external view returns(bool is_claimed) {
    is_claimed = _is_name_claimed[to_lower(name)];
  }

  function tokenURI(uint256 name_id) public view returns (string memory output) {
    uint summoner = name_id_to_summoner[name_id];
    output = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';
    if (summoner > 0) {
        output = string(abi.encodePacked(output, "Level ", toString(rm.level(summoner)), ' ', rm.classes(rm.class(summoner)), '</text><text x="10" y="40" class="base">'));
    }
    output = string(abi.encodePacked(output, names[name_id], '</text></svg>'));
    output = string(abi.encodePacked('data:application/json;base64,', Base64.encode(bytes(string(abi.encodePacked('{"name": "', names[name_id], '", "description": "Rarity ERC721 names for summoners.", "image": "data:image/svg+xml;base64,', Base64.encode(bytes(output)), '"}'))))));
  }

  // --- Internal View functions ---

  // check if msg.sender has control over this summoner id
  function _isApprovedOrOwner(uint256 _summoner) internal view returns (bool) {
    return rm.getApproved(_summoner) == msg.sender || rm.ownerOf(_summoner) == msg.sender;
  }

  // check if msg.sender has control over this name id
  function _isApprovedOrOwnerOfName(uint256 _name_id) internal view returns (bool) {
    uint256 summonerId = name_id_to_summoner[_name_id];
    return _isApprovedOrOwner(summonerId);
  }

  // @dev Check if the name string is valid (Alphanumeric and spaces without leading or trailing space)
  function validate_name(string memory str) internal pure returns (bool){
    bytes memory b = bytes(str);
    if(b.length < 1) return false;
    if(b.length > 25) return false; // Cannot be longer than 25 characters
    if(b[0] == 0x20) return false; // Leading space
    if (b[b.length - 1] == 0x20) return false; // Trailing space

    bytes1 last_char = b[0];

    for (uint i; i<b.length; i++){
      bytes1 char = b[i];

      if (char == 0x20 && last_char == 0x20) return false; // Cannot contain continous spaces

      if (
        !(char >= 0x30 && char <= 0x39) && //9-0
        !(char >= 0x41 && char <= 0x5A) && //A-Z
        !(char >= 0x61 && char <= 0x7A) && //a-z
        !(char == 0x20) //space
      )
        return false;

      last_char = char;
    }

    return true;
  }

  // @dev Converts the string to lowercase
  function to_lower(string memory str) internal pure returns (string memory){
    bytes memory b_str = bytes(str);
    bytes memory b_lower = new bytes(b_str.length);
    for (uint i = 0; i < b_str.length; i++) {
        // Uppercase character
        if ((uint8(b_str[i]) >= 65) && (uint8(b_str[i]) <= 90)) {
            b_lower[i] = bytes1(uint8(b_str[i]) + 32);
        } else {
            b_lower[i] = b_str[i];
        }
    }
    return string(b_lower);
  }

  function toString(int value) internal pure returns (string memory) {
    string memory _string = '';
    if (value < 0) {
        _string = '-';
        value = value * -1;
    }
    return string(abi.encodePacked(_string, toString(uint(value))));
  }

  function toString(uint256 value) internal pure returns (string memory) {
    // Inspired by OraclizeAPI's implementation - MIT license
    // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

    if (value == 0) {
        return "0";
    }
    uint256 temp = value;
    uint256 digits;
    while (temp != 0) {
        digits++;
        temp /= 10;
    }
    bytes memory buffer = new bytes(digits);
    while (value != 0) {
        digits -= 1;
        buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
        value /= 10;
    }
    return string(buffer);
  }

  // --- Admin functions ---
  
  function withdrawFunds(IERC20 token) external onlyOwner {
    uint256 tokenBalance = token.balanceOf(address(this));

    token.safeTransfer(msg.sender, tokenBalance);
  }

  function setBuyToken(IERC20 _buyToken) external onlyOwner checkFinalized {
    buyToken = _buyToken;
  }

  function setBuyTokenPrice(uint256 _buyTokenPrice) external onlyOwner checkFinalized {
    buyTokenPrice = _buyTokenPrice;
  }

  function setBuyTokenAndPrice(IERC20 _buyToken, uint256 _buyTokenPrice) external onlyOwner checkFinalized {
    buyToken = _buyToken;
    buyTokenPrice = _buyTokenPrice;
  }

  function finalizeBuyToken() external onlyOwner {
    finalized = true;
  }
}