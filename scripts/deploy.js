const hardhat = require('hardhat');
const { constants, utils } = require('ethers');
require('dotenv').config();

const { PAYMENT_TOKEN, NAME_BUY_PRICE_WEI } = process.env;

async function main() {

  accounts = await hardhat.ethers.getSigners();
  owner = accounts[0];

  const Scarcity = await hardhat.ethers.getContractFactory('contracts/core/rarity.sol:rarity');
  const scarcity = await Scarcity.deploy();
  await scarcity.deployed();

  const NamesV3 = await hardhat.ethers.getContractFactory('contracts/core/NamesV3.sol:NamesV3');
  const namesV3 = await NamesV3.deploy(scarcity.address, PAYMENT_TOKEN, NAME_BUY_PRICE_WEI);
  await namesV3.deployed();

  const Gold = await hardhat.ethers.getContractFactory('contracts/core/GoldV2.sol:GoldV2');
  const gold = await Gold.deploy(scarcity.address, namesV3.address);
  await gold.deployed();

  const Attributes = await hardhat.ethers.getContractFactory('contracts/core/attributes.sol:rarity_attributes');
  const attributes = await Attributes.deploy(scarcity.address);
  await attributes.deployed();

  const Materials = await hardhat.ethers.getContractFactory('contracts/core/rarity_crafting-materials-1.sol:rarity_crafting_materials');
  const materials = await Materials.deploy(scarcity.address, attributes.address);
  await materials.deployed();

  const Codex_skills = await hardhat.ethers.getContractFactory('contracts/codex/codex-skills.sol:codex');
  const codex_skills = await Codex_skills.deploy();
  await codex_skills.deployed();

  const Codex_class_skills = await hardhat.ethers.getContractFactory('contracts/codex/codex-class-skills.sol:codex');
  const codex_class_skills = await Codex_class_skills.deploy(codex_skills.address);
  await codex_class_skills.deployed();

  const Skills = await hardhat.ethers.getContractFactory('contracts/core/skills.sol:rarity_skills');
  const skills = await Skills.deploy(scarcity.address, attributes.address, codex_skills.address);
  await skills.deployed();

  const Codex_base_random = await hardhat.ethers.getContractFactory('contracts/codex/codex-base-random.sol:codex');
  const codex_base_random = await Codex_base_random.deploy();
  await codex_base_random.deployed();

  const Codex_items_goods = await hardhat.ethers.getContractFactory('contracts/codex/codex-items-goods.sol:codex');
  const codex_items_goods = await Codex_items_goods.deploy();
  await codex_items_goods.deployed();

  const Codex_items_armor = await hardhat.ethers.getContractFactory('contracts/codex/codex-items-armor.sol:codex');
  const codex_items_armor = await Codex_items_armor.deploy();
  await codex_items_armor.deployed();

  const Codex_items_weapons = await hardhat.ethers.getContractFactory('contracts/codex/codex-items-weapons.sol:codex');
  const codex_items_weapons = await Codex_items_weapons.deploy();
  await codex_items_weapons.deployed();

  const Codex_feats_1 = await hardhat.ethers.getContractFactory('contracts/codex/codex-feats-1.sol:codex');
  const codex_feats_1 = await Codex_feats_1.deploy();
  await codex_feats_1.deployed();

  const Crafting = await hardhat.ethers.getContractFactory('contracts/core/rarity_crafting_common.sol:rarity_crafting');
  const crafting = await Crafting.deploy(scarcity.address, attributes.address, materials.address, gold.address, skills.address, codex_base_random.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);
  await crafting.deployed();

  const Wrapped_gold = await hardhat.ethers.getContractFactory('contracts/wgold.sol:wrapped_scarcity_gold');
  const wrapped_gold = await Wrapped_gold.deploy(scarcity.address, gold.address);
  await wrapped_gold.deployed();

  const Adventure_time = await hardhat.ethers.getContractFactory('contracts/adventure-time.sol:AdventureTime');
  const adventure_time = await Adventure_time.deploy(scarcity.address);
  await adventure_time.deployed();

  const Daycare_manager = await hardhat.ethers.getContractFactory('contracts/daycare-manager.sol:DaycareManager');
  const daycare_manager = await Daycare_manager.deploy(adventure_time.address);
  await daycare_manager.deployed();
  
  const Library = await hardhat.ethers.getContractFactory('contracts/scarcity-library.sol:rarity_library');
  const library = await Library.deploy(scarcity.address, attributes.address, skills.address, gold.address, materials.address, crafting.address, namesV3.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);
  await library.deployed();

  const ProxyAdmin = await hardhat.ethers.getContractFactory('contracts/market/ProxyAdmin.sol:ProxyAdminImpl');
  const proxyAdmin = await ProxyAdmin.deploy();
  await proxyAdmin.deployed();

  const Market = await hardhat.ethers.getContractFactory('contracts/market/ScarcityCraftingIMarket.sol:RarityCraftingIMarket');
  const marketLogic = await Market.deploy();
  await marketLogic.deployed();
  await marketLogic.connect(owner).initialize(constants.AddressZero, constants.AddressZero, utils.parseEther('0'));

  const ProxyMarket = await hardhat.ethers.getContractFactory('contracts/market/ScarcityCraftingIMarketProxy.sol:RarityCraftingIMarketProxy');
  const fee = 0;
  const data = marketLogic.interface.encodeFunctionData("initialize", [crafting.address, wrapped_gold.address, fee]);
  const proxyMarket = await ProxyMarket.deploy(marketLogic.address, proxyAdmin.address, data);   
  await proxyMarket.deployed();

  await new Promise(resolve => setTimeout(resolve, 60000));

  await hardhat.run("verify:verify", {address: scarcity.address});
  await hardhat.run("verify:verify", {address: namesV3.address, constructorArguments: [scarcity.address, PAYMENT_TOKEN, NAME_BUY_PRICE_WEI]});
  await hardhat.run("verify:verify", {address: gold.address, constructorArguments: [scarcity.address, namesV3.address]});
  await hardhat.run("verify:verify", {address: attributes.address, constructorArguments: [scarcity.address]});
  await hardhat.run("verify:verify", {address: materials.address, constructorArguments: [scarcity.address, attributes.address]});
  await hardhat.run("verify:verify", {address: codex_skills.address});
  await hardhat.run("verify:verify", {address: codex_class_skills.address, constructorArguments: [codex_skills.address]});
  await hardhat.run("verify:verify", {address: skills.address, constructorArguments: [scarcity.address, attributes.address, codex_skills.address]});
  await hardhat.run("verify:verify", {address: codex_base_random.address});
  await hardhat.run("verify:verify", {address: codex_items_goods.address});
  await hardhat.run("verify:verify", {address: codex_items_armor.address});
  await hardhat.run("verify:verify", {address: codex_items_weapons.address});
  await hardhat.run("verify:verify", {address: codex_feats_1.address});
  await hardhat.run("verify:verify", {address: crafting.address, constructorArguments: [scarcity.address, attributes.address, materials.address, gold.address, skills.address, codex_base_random.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address]});
  await hardhat.run("verify:verify", {address: wrapped_gold.address, constructorArguments: [scarcity.address, gold.address]});
  await hardhat.run("verify:verify", {address: adventure_time.address, constructorArguments: [scarcity.address]});
  await hardhat.run("verify:verify", {address: daycare_manager.address, constructorArguments: [adventure_time.address]});
  await hardhat.run("verify:verify", {address: library.address, constructorArguments: [scarcity.address, attributes.address, skills.address, gold.address, materials.address, crafting.address, namesV3.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address]});
  await hardhat.run("verify:verify", {address: proxyAdmin.address, contract: 'contracts/market/ProxyAdmin.sol:ProxyAdminImpl'});
  await hardhat.run("verify:verify", {address: marketLogic.address, contract: 'contracts/market/ScarcityCraftingIMarket.sol:RarityCraftingIMarket'});
  await hardhat.run("verify:verify", {address: proxyMarket.address, constructorArguments: [marketLogic.address, proxyAdmin.address, data], contract: 'contracts/market/ScarcityCraftingIMarketProxy.sol:RarityCraftingIMarketProxy'});

  console.log("Scarcity deployed and verified to: ", scarcity.address);
  console.log("NamesV3 deployed and verified to: ", namesV3.address);
  console.log("Gold deployed and verified to: ", gold.address);
  console.log("Attributes deployed and verified to: ", attributes.address);
  console.log("Materials deployed and verified to: ", materials.address);
  console.log("Codex skills deployed and verified to: ", codex_skills.address);
  console.log("Codex class skills deployed and verified to: ", codex_class_skills.address);
  console.log("Skills deployed and verified to: ", skills.address);
  console.log("Codex base random deployed and verified to: ", codex_base_random.address);
  console.log("Codex items goods deployed and verified to: ", codex_items_goods.address);
  console.log("Codex items armor deployed and verified to: ", codex_items_armor.address);
  console.log("Codex items weapons deployed and verified to: ", codex_items_weapons.address);
  console.log("Codex feats-1 deployed and verified to: ", codex_feats_1.address);
  console.log("Crafting deployed and verified to: ", crafting.address);
  console.log("Wrapped gold deployed and verified to: ", wrapped_gold.address);
  console.log("Adventure time deployed and verified to: ", adventure_time.address);
  console.log("Daycare manager deployed and verified to: ", daycare_manager.address);
  console.log("Library deployed and verified to: ", library.address);
  console.log("ProxyAdmin deployed and verified to: ", proxyAdmin.address);
  console.log("MarketLogic deployed and verified to: ", marketLogic.address);
  console.log("ProxyMarket deployed and verified to: ", proxyMarket.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });