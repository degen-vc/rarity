const hardhat = require('hardhat');
require('dotenv').config();

const { PAYMENT_TOKEN, NAME_BUY_PRICE_WEI } = process.env;

async function main() {

  accounts = await hardhat.ethers.getSigners();
  owner = accounts[0];

  const Scarcity = await hardhat.ethers.getContractFactory('contracts/core/rarity.sol:rarity');
  const scarcity = await Scarcity.deploy();
  await scarcity.deployed();

  console.log("Scarcity deployed to: ", scarcity.address);

  const NamesV3 = await hardhat.ethers.getContractFactory('contracts/core/NamesV3.sol:NamesV3');
  const namesV3 = await NamesV3.deploy(scarcity.address, PAYMENT_TOKEN, NAME_BUY_PRICE_WEI);
  await namesV3.deployed();

  console.log("NamesV3 deployed to: ", namesV3.address);

  const Gold = await hardhat.ethers.getContractFactory('contracts/core/GoldV2.sol:GoldV2');
  const gold = await Gold.deploy(scarcity.address, namesV3.address);
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

  const Codex_class_skills = await hardhat.ethers.getContractFactory('contracts/codex/codex-class-skills.sol:codex');
  const codex_class_skills = await Codex_class_skills.deploy(codex_skills.address);
  await codex_class_skills.deployed();

  console.log("Codex class skills deployed to: ", codex_class_skills.address);

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

  const Codex_feats_1 = await hardhat.ethers.getContractFactory('contracts/codex/codex-feats-1.sol:codex');
  const codex_feats_1 = await Codex_feats_1.deploy();
  await codex_feats_1.deployed();

  console.log("Codex feats-1 deployed to: ", codex_feats_1.address);

  const Crafting = await hardhat.ethers.getContractFactory('contracts/core/rarity_crafting_common.sol:rarity_crafting');
  const crafting = await Crafting.deploy(scarcity.address, attributes.address, materials.address, gold.address, skills.address, codex_base_random.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);
  await crafting.deployed();

  console.log("Crafting deployed to: ", crafting.address);

  const Wrapped_gold = await hardhat.ethers.getContractFactory('contracts/wgold.sol:wrapped_scarcity_gold');
  const wrapped_gold = await Wrapped_gold.deploy(scarcity.address, gold.address);
  await wrapped_gold.deployed();

  console.log("Wrapped gold deployed to: ", wrapped_gold.address);

  const Adventure_time = await hardhat.ethers.getContractFactory('contracts/adventure-time.sol:AdventureTime');
  const adventure_time = await Adventure_time.deploy(scarcity.address);
  await adventure_time.deployed();

  console.log("Adventure time deployed to: ", adventure_time.address);

  const Daycare_manager = await hardhat.ethers.getContractFactory('contracts/daycare-manager.sol:DaycareManager');
  const daycare_manager = await Daycare_manager.deploy(adventure_time.address);
  await daycare_manager.deployed();

  console.log("Daycare manager deployed to: ", daycare_manager.address);

  const Library = await hardhat.ethers.getContractFactory('contracts/scarcity-library.sol:rarity_library');
  const library = await Library.deploy(scarcity.address, attributes.address, skills.address, gold.address, materials.address, crafting.address, namesV3.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);
  await library.deployed();

  console.log("Library deployed to: ", library.address);
  
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });