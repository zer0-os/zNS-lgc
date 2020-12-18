import { expect, use } from 'chai'
import { ethers } from 'hardhat'
import { solidity } from 'ethereum-waffle'
import { Registrar__factory, Registrar} from '../typechain'
import { Signer } from 'ethers'
import {getAccounts } from '../src/utils'
use(solidity)

describe('registry', function () {
  let registrar: Registrar
  let signers: Signer[]
  let accs: string[]
  this.beforeAll(async function () {
      signers = await ethers.getSigners()
      accs = await getAccounts(signers)
      const factory = await ethers.getContractFactory('Registrar') as Registrar__factory
      registrar = await factory.deploy(accs[0])
      await registrar.deployed()
  })
  it('validate string', async function () {
    console.log(await registrar.validateString('foo\\"'))
    console.log(await registrar.validateString('foo.bar.baz"'))
    console.log(await registrar.validateString('foo'))
    console.log(await registrar.validateString('foo.bar.baz'))

    // expect(await registrar.validateString('foo\\"')).to.eq(true)
    // expect(await registrar.validateString('foo"')).to.eq(false)
  })
  // it('registrar owner has root point', async function () {
  //   expect(await registrar.ownerOf(0)).to.eq(accs[0])
  //   expect((await registrar.entries(0)).controller).to.eq(accs[0])
  //   await registrar.transferFrom(accs[0], accs[1], 0)
  //   expect((await registrar.entries(0)).controller).to.eq(accs[1])
  // })
})