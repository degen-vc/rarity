const Ganache = require('./helpers/ganache');
const { expect, use } = require('chai');
const { utils } = require('ethers');

describe('scarcity-library', function() {
  const ganache = new Ganache();

  let accounts;
  let owner;
  let user;
  let receiver;
  let summon_id;

  let scarcity;

  let empty_skill_set = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let barbarian_skill_set = [false,false,false,true,false,true,false,false,false,false,false,false,false,true,false,false,true,true,false,true,false,false,false,false,true,false,false,false,false,false,false,true,true,false,false,false];
  let paladin_skill_set = [false,false,false,false,true,true,false,true,false,false,false,false,false,true,true,false,false,false,true,false,false,false,false,true,true,false,true,false,false,false,false,false,false,false,false,false];


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
    
    await scarcity.connect(owner).summon(11);
    names_keeper_id = (await scarcity.next_summoner()) - 1;

    const Names = await ethers.getContractFactory('contracts/core/namesv2.sol:rarity_names');
    names = await Names.deploy(scarcity.address, gold.address, names_keeper_id);

    const Library = await ethers.getContractFactory('contracts/scarcity-library.sol:rarity_library');
    library = await Library.deploy(scarcity.address, attributes.address, skills.address, gold.address, materials.address, crafting.address, names.address, codex_items_goods.address, codex_items_armor.address, codex_items_weapons.address);

    await ganache.snapshot();
  });

  beforeEach('setup crafter', async ()=> {
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
 
    balanceOfSummon = await gold.balanceOf(summon_id);

    await gold.connect(user).approve(summon_id, 0, balanceOfSummon);
    await scarcity.connect(user).approve(crafting.address, summon_id);
  });

  afterEach('revert', function() { return ganache.revert(); });

  it('should return right service data for new summoner', async ()=> {
    await scarcity.connect(user).summon(1);
    summon_id = (await scarcity.next_summoner()) - 1;
    data = await library.summonerServiceData(summon_id);

    expect(data.goldBalance).to.equal(utils.parseEther('0'));
    expect(data.xp).to.equal(0);
    expect(data.class).to.equal('Barbarian');
    expect(data.level).to.equal(1);
    expect(data.transferred).to.equal(false);
    expect(data.hasName).to.equal(false);
    expect(data.current_skills).to.eql(empty_skill_set);
    expect(data.class_skills).to.eql(barbarian_skill_set);
    expect(data._str).to.equal(0);
    expect(data._dex).to.equal(0);
    expect(data._con).to.equal(0);
    expect(data._int).to.equal(0);
    expect(data._wis).to.equal(0);
    expect(data._cha).to.equal(0);
  });

  it('should return right service data for upgraded summoner', async ()=> {
    await scarcity.connect(user).summon(7);
    summon_id = (await scarcity.next_summoner()) - 1;

    for (let i = 0; i < 5; i++) {
      await scarcity.connect(user).adventure(summon_id);
      await ganache.increaseTime(24*60*60 + 1);
    }
  
    await scarcity.connect(user).level_up(summon_id);
    await gold.connect(user).claim(summon_id);

    await attributes.connect(user).point_buy(summon_id, 8, 8, 8, 22, 8, 8);
    
    let test_skill_set = [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    await skills.connect(user).set_skills(summon_id, test_skill_set);
    
    await scarcity.connect(user).transferFrom(user.address, receiver.address, summon_id);

    executor_id = await names.EXECUTOR_ID();
    name_price = await names.NAME_GOLD_PRICE();

    await gold.connect(receiver).approve(summon_id, executor_id, name_price);
    await scarcity.connect(receiver).approve(names.address, summon_id);
    await names.connect(receiver).claim('testname', summon_id);    

    data = await library.summonerServiceData(summon_id);
    expect(data.goldBalance).to.equal(utils.parseEther('800'));
    expect(data.xp).to.equal(utils.parseEther('250'));
    expect(data.class).to.equal('Paladin');
    expect(data.level).to.equal(2);
    expect(data.transferred).to.equal(true);
    expect(data.hasName).to.equal(true);
    expect(data.current_skills).to.eql(test_skill_set);
    expect(data.class_skills).to.eql(paladin_skill_set);
    expect(data._str).to.equal(8);
    expect(data._dex).to.equal(8);
    expect(data._con).to.equal(8);
    expect(data._int).to.equal(22);
    expect(data._wis).to.equal(8);
    expect(data._cha).to.equal(8);
  });

  it('should return right service data for crafted item(goods)', async ()=> {
    attempt = 0;
    do {
      await scarcity.connect(user).adventure(summon_id);
      await crafting.connect(user).craft(summon_id, 1, 1, 0);
      bal = await crafting.balanceOf(user.address);

      await ganache.increaseTime(24*60*60 + 1);
      attempt++;
      if (attempt > 100) expect.fail("Too many craft attempts");
    } while(bal < 1);

    item_token_id = (await crafting.next_item()) - 1;
    data = await library.itemServiceData(item_token_id);

    expect(data.base_type).to.equal("Goods");
    expect(data.item_type).to.equal(1);
    expect(data.weight).to.equal(2);
    expect(data.gold_cost).to.equal(utils.parseEther('1'));
    expect(data.name).to.equal("Caltrops");
    expect(data.description).to.equal("A caltrop is a four-pronged iron spike crafted so that one prong faces up no matter how the caltrop comes to rest. You scatter caltrops on the ground in the hope that your enemies step on them or are at least forced to slow down to avoid them. One 2-pound bag of caltrops covers an area 5 feet square.");
    expect(data.proficiency).to.equal('');
    expect(data.encumbrance).to.equal('');
    expect(data.damage_type).to.equal('');
    expect(data.damage).to.equal(0);
    expect(data.critical).to.equal(0);
    expect(data.critical_modifier).to.equal(0);
    expect(data.range_increment).to.equal(0);
    expect(data.armor_bonus).to.equal(0);
    expect(data.max_dex_bonus).to.equal(0);
    expect(data.penalty).to.equal(0);
    expect(data.spell_failure).to.equal(0);
  });

  it('should return right service data for crafted item(armor)', async ()=> {
    attempt = 0;
    do {
      await scarcity.connect(user).adventure(summon_id);
      await crafting.connect(user).craft(summon_id, 2, 5, 0);
      bal = await crafting.balanceOf(user.address);

      await ganache.increaseTime(24*60*60 + 1);
      attempt++;
      if (attempt > 100) expect.fail("Too many craft attempts");
    } while(bal < 1);

    item_token_id = (await crafting.next_item()) - 1;
    data = await library.itemServiceData(item_token_id);

    expect(data.base_type).to.equal("Armor");
    expect(data.item_type).to.equal(5);
    expect(data.weight).to.equal(25);
    expect(data.gold_cost).to.equal(utils.parseEther('15'));
    expect(data.name).to.equal("Hide");
    expect(data.description).to.equal('');
    expect(data.proficiency).to.equal("Medium");
    expect(data.encumbrance).to.equal('');
    expect(data.damage_type).to.equal('');
    expect(data.damage).to.equal(0);
    expect(data.critical).to.equal(0);
    expect(data.critical_modifier).to.equal(0);
    expect(data.range_increment).to.equal(0);
    expect(data.armor_bonus).to.equal(3);
    expect(data.max_dex_bonus).to.equal(4);
    expect(data.penalty).to.equal(-3);
    expect(data.spell_failure).to.equal(20);
  });

  it('should return right service data for crafted item(weapon)', async ()=> {
    attempt = 0;
    do {
      await scarcity.connect(user).adventure(summon_id);
      await crafting.connect(user).craft(summon_id, 3, 13, 0);
      bal = await crafting.balanceOf(user.address);

      await ganache.increaseTime(24*60*60 + 1);
      attempt++;
      if (attempt > 100) expect.fail("Too many craft attempts");
    } while(bal < 1);

    item_token_id = (await crafting.next_item()) - 1;
    data = await library.itemServiceData(item_token_id);

    expect(data.base_type).to.equal("Weapons");
    expect(data.item_type).to.equal(13);
    expect(data.weight).to.equal(8);
    expect(data.gold_cost).to.equal(utils.parseEther('50'));
    expect(data.name).to.equal("Crossbow, heavy");
    expect(data.description).to.equal("You draw a heavy crossbow back by turning a small winch. Loading a heavy crossbow is a full-round action that provokes attacks of opportunity.");
    expect(data.proficiency).to.equal("Simple");
    expect(data.encumbrance).to.equal("Ranged Weapons");
    expect(data.damage_type).to.equal("Piercing");
    expect(data.damage).to.equal(10);
    expect(data.critical).to.equal(2);
    expect(data.critical_modifier).to.equal(-1);
    expect(data.range_increment).to.equal(120);
    expect(data.armor_bonus).to.equal(0);
    expect(data.max_dex_bonus).to.equal(0);
    expect(data.penalty).to.equal(0);
    expect(data.spell_failure).to.equal(0);
  });
});
