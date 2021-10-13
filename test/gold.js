const Ganache = require('./helpers/ganache');
const { expect } = require('chai');
const { utils } = require('ethers');

describe('Gold', function() {
  const ganache = new Ganache();

  let accounts;
  let owner;
  let user;

  let scarcity;

  before('setup', async function() {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user = accounts[1];

    const Scarcity = await ethers.getContractFactory('contracts/core/rarity.sol:rarity');
    scarcity = await Scarcity.deploy();

    const Gold = await ethers.getContractFactory('contracts/core/gold.sol:rarity_gold');
    gold = await Gold.deploy(scarcity.address);

    await ganache.snapshot();
  });

  afterEach('revert', function() { return ganache.revert(); });

  it('should be possible to change formula params for owner', async ()=> {
    expect(await gold.paramA()).to.equal(utils.parseEther('500'));
    expect(await gold.paramB()).to.equal(utils.parseEther('500'));
    expect(await gold.paramC()).to.equal(utils.parseEther('0'));
    expect(await gold.paramD()).to.equal(utils.parseEther('0'));
    await gold.connect(owner).updateFormulaParams(utils.parseEther('1000'), utils.parseEther('2000'), utils.parseEther('3000'), utils.parseEther('4000'));
    expect(await gold.paramA()).to.equal(utils.parseEther('1000'));
    expect(await gold.paramB()).to.equal(utils.parseEther('2000'));
    expect(await gold.paramC()).to.equal(utils.parseEther('3000'));
    expect(await gold.paramD()).to.equal(utils.parseEther('4000'));
  });

  it('should NOT be possible to change formula params for non-owner', async ()=> {
    expect(await gold.paramA()).to.equal(utils.parseEther('500'));
    expect(await gold.paramB()).to.equal(utils.parseEther('500'));
    expect(await gold.paramC()).to.equal(utils.parseEther('0'));
    expect(await gold.paramD()).to.equal(utils.parseEther('0'));
    await expect(gold.connect(user).updateFormulaParams(utils.parseEther('1000'), utils.parseEther('100'), utils.parseEther('10'), utils.parseEther('1'))).to.be.revertedWith('Ownable: caller is not the owner');;
    expect(await gold.paramA()).to.equal(utils.parseEther('500'));
    expect(await gold.paramB()).to.equal(utils.parseEther('500'));
    expect(await gold.paramC()).to.equal(utils.parseEther('0'));
    expect(await gold.paramD()).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and params (1000, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('1000'), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and params (1000, 1000, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('1000'), utils.parseEther('1000'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and params (0, 0, 500, 500)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('500'), utils.parseEther('500'));
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 1000 wealth on 2 level and params (1000, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('1000'), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(2)).to.equal(utils.parseEther('1000'));
  });

  it('should return 1000 wealth on 2 level and params (500, 500, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('500'), utils.parseEther('500'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(2)).to.equal(utils.parseEther('1000'));
  });

  it('should return 1000 wealth on 2 level and params (0, 0, 500, 500)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('500'), utils.parseEther('500'));
    expect(await gold.wealth_by_level(2)).to.equal(utils.parseEther('1000'));
  });

  it('should return 81000 wealth on 10 level and params (1000, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('1000'), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(10)).to.equal(utils.parseEther('81000'));
  });

  it('should return 45000 wealth on 10 level and params (500, 500, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('500'), utils.parseEther('500'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(10)).to.equal(utils.parseEther('45000'));
  });

  it('should return 556 wealth on 10 level and params (0, 0, 500, 500)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('500'), utils.parseEther('500'));
    expect(await gold.wealth_by_level(10)).to.below(utils.parseEther('556'));
    expect(await gold.wealth_by_level(10)).to.above(utils.parseEther('555'));
  });

  it('should return 0 wealth on 100 level and params (0, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(100)).to.equal(utils.parseEther('0'));
  });

  it('should return 38105 wealth on 20 level and params (100, 100, 100, 100)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('100'), utils.parseEther('100'), utils.parseEther('100'), utils.parseEther('100'));
    expect(await gold.wealth_by_level(20)).to.below(utils.parseEther('38106'));
    expect(await gold.wealth_by_level(20)).to.above(utils.parseEther('38105'));
  });

  it('should return 0 wealth on 20 level and params (0, -100, 1000, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('-100'), utils.parseEther('1000'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('0'));
  });

  it('should return 600 wealth on 3 level and params (-100, 0, 1000, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('-100'), utils.parseEther('0'), utils.parseEther('1000'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(3)).to.equal(utils.parseEther('600'));
  });

  it('should return 0 wealth on 33 level and params (-100, 0, 1000, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('-100'), utils.parseEther('0'), utils.parseEther('1000'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(33)).to.equal(utils.parseEther('0'));
  });

  it('should return 19000 wealth on 20 level and params (0, 1000, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('1000'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('19000'));
  });

  it('should return 0 wealth on 2 level and params (-1, -1, -1, -1)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('-1'), utils.parseEther('-1'), utils.parseEther('-1'), utils.parseEther('-1'));
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('0'));
  });

  it('should return 100 wealth on 20 level and params (0, -50, 1050, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('-50'), utils.parseEther('1050'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('100'));
  });

  it('should return 0 wealth on 1000000 level and params (-1000000, 1000000, 1000000, 1000000)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('-1000000'), utils.parseEther('1000000'), utils.parseEther('1000000'), utils.parseEther('1000000'));
    expect(await gold.wealth_by_level(1000000)).to.equal(utils.parseEther('0'));
  });

  it('should return >0 wealth on 1000000 level and params (0, 0, 0, 1)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('1'));
    expect(await gold.wealth_by_level(1000000)).to.above(utils.parseEther('0'));
  });

});
