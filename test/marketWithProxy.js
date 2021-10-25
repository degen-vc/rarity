const Ganache = require('./helpers/ganache');
const { expect, use } = require('chai');
const { constants, utils } = require('ethers');

describe('marketWithProxy', function() {
  const ganache = new Ganache();
  const fee = 9;

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

    const Wrapped_gold = await ethers.getContractFactory('contracts/wgold.sol:wrapped_scarcity_gold');
    wrapped_gold = await Wrapped_gold.deploy(scarcity.address, gold.address);

    const ProxyAdmin = await ethers.getContractFactory('contracts/market/ProxyAdmin.sol:ProxyAdminImpl');
    proxyAdmin = await ProxyAdmin.deploy(); 

    const Market = await ethers.getContractFactory('contracts/market/ScarcityCraftingIMarket.sol:RarityCraftingIMarket');
    marketLogic = await Market.deploy();
    marketLogic.connect(owner).initialize(constants.AddressZero, constants.AddressZero, utils.parseEther('0'));

    const ProxyMarket = await ethers.getContractFactory('contracts/market/ScarcityCraftingIMarketProxy.sol:RarityCraftingIMarketProxy');
    let data = marketLogic.interface.encodeFunctionData("initialize", [crafting.address, wrapped_gold.address, fee]);
    proxyMarket = await ProxyMarket.deploy(marketLogic.address, proxyAdmin.address, data);   

    market = Market.attach(proxyMarket.address);

    await ganache.snapshot();
  });

  beforeEach('create crafter and craft one item', async function() {
    await scarcity.connect(user).summon(1);
  
    summon_id = (await scarcity.next_summoner()) - 1;

    for (let i = 0; i < 20; i++) {
      await scarcity.connect(user).adventure(summon_id);
      await ganache.increaseTime(24*60*60 + 1);
    }

    await scarcity.connect(user).level_up(summon_id);
    await scarcity.connect(user).level_up(summon_id);
    await gold.connect(user).claim(summon_id);
  
    await attributes.connect(user).point_buy(summon_id, 8, 8, 8, 22, 8, 8);
    await skills.connect(user).set_skills(summon_id, [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  
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
      if (attempt > 100) expect.fail("Too many craft attempts");
    } while(bal < 1);
  });

  afterEach('revert', function() { return ganache.revert(); });

  it('should be possible to list item on market', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('100');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);
  });

  it('should be NOT possible to list item on market with 0 price', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('0');
    await crafting.connect(user).approve(market.address, itemId);
    await expect(market.connect(user).list(itemId, price)).to.be.revertedWith('bad price');
  });

  it('should be possible to unlist item from market', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('100');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await market.connect(user).unlist(itemId);
    expect(await crafting.ownerOf(itemId)).equal(user.address);
    expect(await market.listLength()).equal(0);
  });

  it('should be NOT possible to unlist foreign item from market', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('100');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await expect(market.connect(receiver).unlist(itemId)).to.be.revertedWith('not lister');
  });

  it('should be possible to buy item from market', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('250');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await gold.connect(user).approve(summon_id, await wrapped_gold.SUMMMONER_ID(), price);
    await wrapped_gold.connect(user).deposit(summon_id, price);
    await wrapped_gold.connect(user).transfer(receiver.address, price);

    balanceUser = await wrapped_gold.balanceOf(user.address);

    await wrapped_gold.connect(receiver).approve(market.address, price);
    await market.connect(receiver).buy(itemId);
    expect(await crafting.ownerOf(itemId)).equal(receiver.address);
    expect(await market.listLength()).equal(0);
    expect(await wrapped_gold.balanceOf(receiver.address)).equal(0);
    expect(await wrapped_gold.balanceOf(user.address)).equal((price - price * fee / 10000).toString());
    expect(await wrapped_gold.balanceOf(market.address)).equal((price * fee / 10000).toString());
  });

  it('should be NOT possible to buy item from market with lower approve', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('250');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await gold.connect(user).approve(summon_id, await wrapped_gold.SUMMMONER_ID(), price);
    await wrapped_gold.connect(user).deposit(summon_id, price);
    await wrapped_gold.connect(user).transfer(receiver.address, price);

    balanceUser = await wrapped_gold.balanceOf(user.address);

    await wrapped_gold.connect(receiver).approve(market.address, utils.parseEther('249'));
    await expect(market.connect(receiver).buy(itemId)).to.be.revertedWith('ERC20: transfer amount exceeds allowance');
  });

  it('should be possible to withdraw fees be admin', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('250');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await gold.connect(user).approve(summon_id, await wrapped_gold.SUMMMONER_ID(), price);
    await wrapped_gold.connect(user).deposit(summon_id, price);
    await wrapped_gold.connect(user).transfer(receiver.address, price);

    balanceUser = await wrapped_gold.balanceOf(user.address);

    await wrapped_gold.connect(receiver).approve(market.address, price);
    await market.connect(receiver).buy(itemId);

    let fees = (price * fee / 10000).toString()

    expect(await wrapped_gold.balanceOf(market.address)).equal(fees);
    await market.connect(owner).withdraw(fees);
    expect(await wrapped_gold.balanceOf(owner.address)).equal(fees);
  });

  it('should be NOT possible to withdraw fees be not admin', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('250');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await gold.connect(user).approve(summon_id, await wrapped_gold.SUMMMONER_ID(), price);
    await wrapped_gold.connect(user).deposit(summon_id, price);
    await wrapped_gold.connect(user).transfer(receiver.address, price);

    balanceUser = await wrapped_gold.balanceOf(user.address);
    await wrapped_gold.connect(receiver).approve(market.address, price);
    await market.connect(receiver).buy(itemId);
    let fees = (price * fee / 10000).toString()

    expect(await wrapped_gold.balanceOf(market.address)).equal(fees);
    await expect(market.connect(receiver).withdraw(fees)).to.be.revertedWith('!owner');
  });

  it('should be NOT possible to withdraw more fees than collected', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('250');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await gold.connect(user).approve(summon_id, await wrapped_gold.SUMMMONER_ID(), price);
    await wrapped_gold.connect(user).deposit(summon_id, price);
    await wrapped_gold.connect(user).transfer(receiver.address, price);

    balanceUser = await wrapped_gold.balanceOf(user.address);
    await wrapped_gold.connect(receiver).approve(market.address, price);
    await market.connect(receiver).buy(itemId);
    let fees = (price * (fee + 1) / 10000).toString()

    await expect(market.connect(owner).withdraw(fees)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
  });

  it('should be NOT possible to buy item that not listed on the market', async ()=> {
    let itemId = crafting.tokenOfOwnerByIndex(user.address, 0);
    let price = utils.parseEther('250');
    await crafting.connect(user).approve(market.address, itemId);
    await market.connect(user).list(itemId, price);
    expect(await crafting.ownerOf(itemId)).equal(market.address);
    expect(await market.listLength()).equal(1);

    await gold.connect(user).approve(summon_id, await wrapped_gold.SUMMMONER_ID(), price);
    await wrapped_gold.connect(user).deposit(summon_id, price);
    await wrapped_gold.connect(user).transfer(receiver.address, price);

    balanceUser = await wrapped_gold.balanceOf(user.address);

    await wrapped_gold.connect(receiver).approve(market.address, price);
    await expect(market.connect(receiver).buy('1000')).to.be.revertedWith('not listed');
  });

});
