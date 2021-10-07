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

  it('should be possible to change formula modifier for owner', async ()=> {
    expect(await gold.formulaModifier()).to.equal(0);
    await gold.connect(owner).updateFormulaModifier(2);
    expect(await gold.formulaModifier()).to.equal(2);
  });

  it('should NOT be possible to change formula modifier for non-owner', async ()=> {
    expect(await gold.formulaModifier()).to.equal(0);
    await expect(gold.connect(user).updateFormulaModifier(2)).to.be.revertedWith('Ownable: caller is not the owner');;
    expect(await gold.formulaModifier()).to.equal(0);
  });

  it('should return 0 wealth on 1 level and modifier 0', async ()=>{
    await gold.connect(owner).updateFormulaModifier(0);
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and modifier 1', async ()=>{
    await gold.connect(owner).updateFormulaModifier(1);
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 1 level and modifier 2', async ()=>{
    await gold.connect(owner).updateFormulaModifier(2);
    expect(await gold.wealth_by_level(1)).to.equal(utils.parseEther('0'));
  });

  it('should return 1000 wealth on 2 level and modifier 0', async ()=>{
    await gold.connect(owner).updateFormulaModifier(0);
    expect(await gold.wealth_by_level(2)).to.equal(utils.parseEther('1000'));
  });

  it('should return 1000 wealth on 2 level and modifier 1', async ()=>{
    await gold.connect(owner).updateFormulaModifier(1);
    expect(await gold.wealth_by_level(2)).to.equal(utils.parseEther('1000'));
  });

  it('should return 1000 wealth on 2 level and modifier 2', async ()=>{
    await gold.connect(owner).updateFormulaModifier(2);
    expect(await gold.wealth_by_level(2)).to.equal(utils.parseEther('1000'));
  });

  it('should return 45000 wealth on 10 level and modifier 0', async ()=>{
    await gold.connect(owner).updateFormulaModifier(0);
    expect(await gold.wealth_by_level(10)).to.equal(utils.parseEther('45000'));
  });

  it('should return 600 wealth on 10 level and modifier 1', async ()=>{
    await gold.connect(owner).updateFormulaModifier(1);
    expect(await gold.wealth_by_level(10)).to.equal(utils.parseEther('600'));
  });

  it('should return 1000 wealth on 10 level and modifier 2', async ()=>{
    await gold.connect(owner).updateFormulaModifier(2);
    expect(await gold.wealth_by_level(10)).to.equal(utils.parseEther('1000'));
  });

  it('should return 190000 wealth on 20 level and modifier 0', async ()=>{
    await gold.connect(owner).updateFormulaModifier(0);
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('190000'));
  });

  it('should return 100 wealth on 20 level and modifier 1', async ()=>{
    await gold.connect(owner).updateFormulaModifier(1);
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('100'));
  });

  it('should return 1000 wealth on 20 level and modifier 2', async ()=>{
    await gold.connect(owner).updateFormulaModifier(2);
    expect(await gold.wealth_by_level(20)).to.equal(utils.parseEther('1000'));
  });

  it('should return 300000 wealth on 25 level and modifier 0', async ()=>{
    await gold.connect(owner).updateFormulaModifier(0);
    expect(await gold.wealth_by_level(25)).to.equal(utils.parseEther('300000'));
  });

  it('should return 0 wealth on 25 level and modifier 1', async ()=>{
    await gold.connect(owner).updateFormulaModifier(1);
    expect(await gold.wealth_by_level(25)).to.equal(utils.parseEther('0'));
  });

  it('should return 1000 wealth on 25 level and modifier 2', async ()=>{
    await gold.connect(owner).updateFormulaModifier(2);
    expect(await gold.wealth_by_level(25)).to.equal(utils.parseEther('1000'));
  });

  it('should return non-zero wealth on 9999 level and modifier 0', async ()=>{
    await gold.connect(owner).updateFormulaModifier(0);
    expect(await gold.wealth_by_level(9999)).to.not.equal(utils.parseEther('0'));
  });

  it('should return 0 wealth on 999999999 level and modifier 1', async ()=>{
    await gold.connect(owner).updateFormulaModifier(1);
    expect(await gold.wealth_by_level(999999999)).to.equal(utils.parseEther('0'));
  });

  it('should return 1000 wealth on 10000000000 level and modifier 255', async ()=>{
    await gold.connect(owner).updateFormulaModifier(255);
    expect(await gold.wealth_by_level(10000000000)).to.equal(utils.parseEther('1000'));
  });

});
