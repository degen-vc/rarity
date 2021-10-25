const Ganache = require('./helpers/ganache');
const { expect } = require('chai');
const { BigNumber, utils } = require('ethers');

describe('Gold', function() {
  const ganache = new Ganache();
  const exp = BigNumber.from("10").pow(18);

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
    expect(await gold.paramA()).to.equal(BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.paramB()).to.equal(BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.paramC()).to.equal(utils.parseEther('0'));
    expect(await gold.paramD()).to.equal(utils.parseEther('0'));
    await gold.connect(owner).updateFormulaParams(BigNumber.from(1000).mul(exp).mul(exp).toString(), BigNumber.from(2000).mul(exp).mul(exp).toString(), BigNumber.from(3000).mul(exp).mul(exp).toString(), BigNumber.from(4000).mul(exp).mul(exp).toString());
    expect(await gold.paramA()).to.equal(BigNumber.from(1000).mul(exp).mul(exp).toString());
    expect(await gold.paramB()).to.equal(BigNumber.from(2000).mul(exp).mul(exp).toString());
    expect(await gold.paramC()).to.equal(BigNumber.from(3000).mul(exp).mul(exp).toString());
    expect(await gold.paramD()).to.equal(BigNumber.from(4000).mul(exp).mul(exp).toString());
  });

  it('should NOT be possible to change formula params for non-owner', async ()=> {
    expect(await gold.paramA()).to.equal(BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.paramB()).to.equal(BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.paramC()).to.equal(utils.parseEther('0'));
    expect(await gold.paramD()).to.equal(utils.parseEther('0'));
    await expect(gold.connect(user).updateFormulaParams(BigNumber.from(1000).mul(exp).mul(exp).toString(), BigNumber.from(2000).mul(exp).mul(exp).toString(), BigNumber.from(3000).mul(exp).mul(exp).toString(), BigNumber.from(4000).mul(exp).mul(exp).toString())).to.be.revertedWith('Ownable: caller is not the owner');;
    expect(await gold.paramA()).to.equal(BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.paramB()).to.equal(BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.paramC()).to.equal(utils.parseEther('0'));
    expect(await gold.paramD()).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and params (1000, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and params (1000, 1000, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(1000).mul(exp).mul(exp).toString(), BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and params (0, 0, 500, 500)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), BigNumber.from(500).mul(exp).mul(exp).toString(), BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 1000 wealth on 2 level and params (1000, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(2)).to.equal(BigNumber.from(1000).mul(exp).toString());
  });

  it('should return 1000 wealth on 2 level and params (500, 500, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(500).mul(exp).mul(exp).toString(), BigNumber.from(500).mul(exp).mul(exp).toString(), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(2)).to.equal(BigNumber.from(1000).mul(exp).toString());
  });

  it('should return 1000 wealth on 2 level and params (0, 0, 500, 500)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), BigNumber.from(500).mul(exp).mul(exp).toString(), BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.wealth_by_level(2)).to.equal(BigNumber.from(1000).mul(exp).toString());
  });

  it('should return 81000 wealth on 10 level and params (1000, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(10)).to.equal(BigNumber.from(81000).mul(exp).toString());
  });

  it('should return 45000 wealth on 10 level and params (500, 500, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(500).mul(exp).mul(exp).toString(), BigNumber.from(500).mul(exp).mul(exp).toString(), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(10)).to.equal(BigNumber.from(45000).mul(exp).toString());
  });

  it('should return 556 wealth on 10 level and params (0, 0, 500, 500)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), BigNumber.from(500).mul(exp).mul(exp).toString(), BigNumber.from(500).mul(exp).mul(exp).toString());
    expect(await gold.wealth_by_level(10)).to.below(BigNumber.from(556).mul(exp).toString());
    expect(await gold.wealth_by_level(10)).to.above(BigNumber.from(555).mul(exp).toString());
  });

  it('should return 0 wealth on 100 level and params (0, 0, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(100)).to.equal(utils.parseEther('0'));
  });

  it('should return 38105 wealth on 20 level and params (100, 100, 100, 100)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(100).mul(exp).mul(exp).toString(), BigNumber.from(100).mul(exp).mul(exp).toString(), BigNumber.from(100).mul(exp).mul(exp).toString(), BigNumber.from(100).mul(exp).mul(exp).toString());
    expect(await gold.wealth_by_level(20)).to.below(BigNumber.from(38106).mul(exp).toString());
    expect(await gold.wealth_by_level(20)).to.above(BigNumber.from(38105).mul(exp).toString());
  });

  it('should return 0 wealth on 20 level and params (0, -100, 1000, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), BigNumber.from(-100).mul(exp).mul(exp).toString(), BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'));
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('0'));
  });

  it('should return 600 wealth on 3 level and params (-100, 0, 1000, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(-100).mul(exp).mul(exp).toString(), utils.parseEther('0'), BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'));
    expect(await gold.wealth_by_level(3)).to.equal(BigNumber.from(600).mul(exp).toString());
  });

  it('should return 0 wealth on 33 level and params (-100, 0, 1000, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(-100).mul(exp).mul(exp).toString(), utils.parseEther('0'), BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'));
    expect(await gold.wealth_by_level(33)).to.equal(utils.parseEther('0'));
  });

  it('should return 19000 wealth on 20 level and params (0, 1000, 0, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), BigNumber.from(1000).mul(exp).mul(exp).toString(), utils.parseEther('0'), utils.parseEther('0'));
    expect(await gold.wealth_by_level(20)).to.equal(BigNumber.from(19000).mul(exp).toString());
  });

  it('should return 0 wealth on 2 level and params (-1, -1, -1, -1)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(-1).mul(exp).mul(exp).toString(), BigNumber.from(-1).mul(exp).mul(exp).toString(), BigNumber.from(-1).mul(exp).mul(exp).toString(), BigNumber.from(-1).mul(exp).mul(exp).toString());
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('0'));
  });

  it('should return 100 wealth on 20 level and params (0, -50, 1050, 0)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), BigNumber.from(-50).mul(exp).mul(exp).toString(), BigNumber.from(1050).mul(exp).mul(exp).toString(), utils.parseEther('0'));
    expect(await gold.wealth_by_level(20)).to.equal(BigNumber.from(100).mul(exp).toString());
  });

  it('should return 0 wealth on 1000000 level and params (-1000000, 1000000, 1000000, 1000000)', async ()=>{
    await gold.connect(owner).updateFormulaParams(BigNumber.from(-1000000).mul(exp).mul(exp).toString(), BigNumber.from(1000000).mul(exp).mul(exp).toString(), BigNumber.from(1000000).mul(exp).mul(exp).toString(), BigNumber.from(1000000).mul(exp).mul(exp).toString());
    expect(await gold.wealth_by_level(1000000)).to.equal(utils.parseEther('0'));
  });

  it('should return >0 wealth on 1000000 level and params (0, 0, 0, 1)', async ()=>{
    await gold.connect(owner).updateFormulaParams(utils.parseEther('0'), utils.parseEther('0'), utils.parseEther('0'), BigNumber.from(1).mul(exp).mul(exp).toString());
    expect(await gold.wealth_by_level(1000000)).to.above(utils.parseEther('0'));
  });

});
