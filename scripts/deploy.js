const hardhat = require('hardhat');
require('dotenv').config();

async function main() {

  accounts = await hardhat.ethers.getSigners();
  owner = accounts[0];

  const Scarcity = await hardhat.ethers.getContractFactory('contracts/core/rarity.sol:rarity');
  const scarcity = await Scarcity.deploy();
  await scarcity.deployed();

  console.log("Scarcity deployed to: ", scarcity.address);

  const Gold = await hardhat.ethers.getContractFactory('contracts/core/gold.sol:rarity_gold');
  const gold = await Gold.deploy(scarcity.address);
  await gold.deployed();

  console.log("Gold deployed to: ", gold.address);

  const Attributes = await hardhat.ethers.getContractFactory('contracts/core/attributes.sol:rarity_attributes');
  const attributes = await Attributes.deploy(scarcity.address);
  await attributes.deployed();

  console.log("Attributes deployed to: ", attributes.address);

  const Materials = await hardhat.ethers.getContractFactory('contracts/core/rarity_crafting-materials-1.sol:rarity_crafting_materials');
  const materials = await Materials.deploy(scarcity.address, attributes.address);
  await materials.deployed();

  console.log("Materials deployed to: ", materials.address);

  const Codex_skills = await hardhat.ethers.getContractFactory('contracts/codex/codex-skills.sol:codex');
  const codex_skills = await Codex_skills.deploy();
  await codex_skills.deployed();

  console.log("Codex skills deployed to: ", codex_skills.address);

  const Skills = await hardhat.ethers.getContractFactory('contracts/core/skills.sol:rarity_skills');
  const skills = await Skills.deploy(scarcity.address, attributes.address, codex_skills.address);
  await skills.deployed();

  console.log("Skills deployed to: ", skills.address);

  const Codex_base_random = await hardhat.ethers.getContractFactory('contracts/codex/codex-base-random.sol:codex');
  const codex_base_random = await Codex_base_random.deploy();
  await codex_base_random.deployed();

  console.log("Codex base random deployed to: ", codex_base_random.address);

  const Codex_items_goods = await hardhat.ethers.getContractFactory('contracts/codex/codex-items-goods.sol:codex');
  const codex_items_goods = await Codex_items_goods.deploy();
  await codex_items_goods.deployed();

  console.log("Codex items goods deployed to: ", codex_items_goods.address);

  const Codex_items_armor = await hardhat.ethers.getContractFactory('contracts/codex/codex-items-armor.sol:codex');
  const codex_items_armor = await Codex_items_armor.deploy();
  await codex_items_armor.deployed();

  console.log("Codex items armor deployed to: ", codex_items_armor.address);

  const Codex_items_weapons = await hardhat.ethers.getContractFactory('contracts/codex/codex-items-weapons.sol:codex');
  const codex_items_weapons = await Codex_items_weapons.deploy();
  await codex_items_weapons.deployed();

  console.log("Codex items weapons deployed to: ", codex_items_weapons.address);

  const Crafting = await hardhat.ethers.getContractFactory('contracts/core/rarity_crafting_common.sol:rarity_crafting');
  const crafting = await Crafting.deploy(scarcity.address, attributes.address, materials.address, gold.address, skills.address, codex_base_random.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);
  await crafting.deployed();

  console.log("Crafting deployed to: ", crafting.address);

  await scarcity.connect(owner).summon(11);
  const names_keeper_id = (await scarcity.next_summoner()) - 1;

  const NamesV2 = await hardhat.ethers.getContractFactory('contracts/core/namesv2.sol:rarity_names');
  const namesV2 = await NamesV2.deploy(scarcity.address, gold.address, names_keeper_id);
  await namesV2.deployed();

  console.log("NamesV2 deployed to: ", namesV2.address);

  const Library = await hardhat.ethers.getContractFactory('contracts/scarcity-library.sol:rarity_library');
  const library = await Library.deploy(scarcity.address, attributes.address, skills.address, gold.address, materials.address, crafting.address, namesV2.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);
  await library.deployed();

  console.log("Library deployed to: ", library.address);
  
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });