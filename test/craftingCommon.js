const Ganache = require('./helpers/ganache');
const { expect, use } = require('chai');
const { utils } = require('ethers');

describe('craftingCommon', function() {
  const ganache = new Ganache();

  let accounts;
  let owner;
  let user;
  let receiver;
  let summon_id;

  let scarcity;

  before('setup', async function() {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user = accounts[1];
    receiver = accounts[2];
    
    const Scarcity = await ethers.getContractFactory('contracts/core/rarity.sol:rarity');
    scarcity = await Scarcity.deploy();

    const Attributes = await ethers.getContractFactory('contracts/core/attributes.sol:rarity_attributes');
    attributes = await Attributes.deploy(scarcity.address);

    const Materials = await ethers.getContractFactory('contracts/core/rarity_crafting-materials-1.sol:rarity_crafting_materials');
    materials = await Materials.deploy(scarcity.address, attributes.address);

    const Gold = await ethers.getContractFactory('contracts/core/gold.sol:rarity_gold');
    gold = await Gold.deploy(scarcity.address);

    const Codex_skills = await ethers.getContractFactory('contracts/codex/codex-skills.sol:codex');
    codex_skills = await Codex_skills.deploy();

    const Skills = await ethers.getContractFactory('contracts/core/skills.sol:rarity_skills');
    skills = await Skills.deploy(scarcity.address, attributes.address, codex_skills.address);
    
    const Codex_base_random = await ethers.getContractFactory('contracts/codex/codex-base-random.sol:codex');
    codex_base_random = await Codex_base_random.deploy();

    const Codex_items_goods = await ethers.getContractFactory('contracts/codex/codex-items-goods.sol:codex');
    codex_items_goods = await Codex_items_goods.deploy();

    const Codex_items_armor = await ethers.getContractFactory('contracts/codex/codex-items-armor.sol:codex');
    codex_items_armor = await Codex_items_armor.deploy();

    const Codex_items_weapons = await ethers.getContractFactory('contracts/codex/codex-items-weapons.sol:codex');
    codex_items_weapons = await Codex_items_weapons.deploy();

    const Crafting = await ethers.getContractFactory('contracts/core/rarity_crafting_common.sol:rarity_crafting');
    crafting = await Crafting.deploy(scarcity.address, attributes.address, materials.address, gold.address, skills.address, codex_base_random.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);

    await ganache.snapshot();
  });

  beforeEach('create crafter', async function() {
    await scarcity.connect(user).summon(1);
  
    summon_id = (await scarcity.next_summoner()) - 1;

    for (let i = 0; i < 5; i++) {
      await scarcity.connect(user).adventure(summon_id);
      await ganache.increaseTime(24*60*60 + 1);
    }

    await scarcity.connect(user).level_up(summon_id);
    await gold.connect(user).claim(summon_id);
  
    await attributes.connect(user).point_buy(summon_id, 8, 8, 8, 22, 8, 8);
    await skills.connect(user).set_skills(summon_id, [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  afterEach('revert', function() { return ganache.revert(); });

  it('should have minter address', async ()=> {
    balanceOfSummon = await gold.balanceOf(summon_id);

    await gold.connect(user).approve(summon_id, 0, balanceOfSummon);
    await scarcity.connect(user).approve(crafting.address, summon_id);

    attempt = 0;
  
    do {
      await scarcity.connect(user).adventure(summon_id);
      await crafting.connect(user).craft(summon_id, 1, 1, 0);
      bal = await crafting.balanceOf(user.address);

      await ganache.increaseTime(24*60*60 + 1);
      attempt++;
    } while(bal < 1 && attempt < 100);

    expect(await crafting.balanceOf(user.address)).to.equal(1);
  });

  it('should NOT change minter address after transfer', async ()=> {

    balanceOfSummon = await gold.balanceOf(summon_id);

    await gold.connect(user).approve(summon_id, 0, balanceOfSummon);
    await scarcity.connect(user).approve(crafting.address, summon_id);
  
    attempt = 0;
  
    do {
      await scarcity.connect(user).adventure(summon_id);
      await crafting.connect(user).craft(summon_id, 1, 1, 0);
      bal = await crafting.balanceOf(user.address);

      await ganache.increaseTime(24*60*60 + 1);
      attempt++;
    } while(bal < 1 && attempt < 100);

    await crafting.connect(user).transferFrom(user.address, receiver.address, 0);
    expect(await crafting.ownerOf(0)).to.equal(receiver.address);
    expect((await crafting.items(0)).minter).to.equal(user.address);
  });

});
