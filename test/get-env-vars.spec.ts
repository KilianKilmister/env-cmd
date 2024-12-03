import { default as sinon } from 'sinon'
import { assert } from 'chai'
import { default as esmock } from 'esmock'
import type { getEnvVars } from '../src/get-env-vars.ts'

let getEnvVarsLib: { getEnvVars: typeof getEnvVars }

describe('getEnvVars', (): void => {
  let getRCFileVarsStub: sinon.SinonStub<any>
  let getEnvFileVarsStub: sinon.SinonStub<any>
  let logInfoStub: sinon.SinonStub<any> | undefined

  before(async (): Promise<void> => {
    getRCFileVarsStub = sinon.stub()
    getEnvFileVarsStub = sinon.stub()
    getEnvVarsLib = await esmock('../src/get-env-vars.ts', {
      '../src/parse-rc-file': {
        getRCFileVars: getRCFileVarsStub
      },
      '../src/parse-env-file': {
        getEnvFileVars: getEnvFileVarsStub
      }
    })
  })

  after((): void => {
    sinon.restore()
  })

  afterEach((): void => {
    sinon.resetHistory()
    sinon.resetBehavior()
    logInfoStub?.restore()
  })

  it('should parse the json .rc file from the default path with the given environment',
    async (): Promise<void> => {
      getRCFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
      const envs = await getEnvVarsLib.getEnvVars({ rc: { environments: ['production'] } })
      assert.isOk(envs)
      assert.lengthOf(Object.keys(envs), 1)
      assert.equal(envs.THANKS, 'FOR ALL THE FISH')
      assert.equal(getRCFileVarsStub.callCount, 1)
      assert.lengthOf(getRCFileVarsStub.args[0][0].environments, 1)
      assert.equal(getRCFileVarsStub.args[0][0].environments[0], 'production')
      assert.equal(getRCFileVarsStub.args[0][0].filePath, './.env-cmdrc')
    },
  )

  it('should print path of custom .rc file and environments to info for verbose',
    async (): Promise<void> => {
      logInfoStub = sinon.stub(console, 'info')
      getRCFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
      await getEnvVarsLib.getEnvVars({ rc: { environments: ['production'] }, verbose: true })
      assert.equal(logInfoStub.callCount, 1)
    },
  )

  it('should search all default .rc file paths', async (): Promise<void> => {
    const pathError = new Error()
    pathError.name = 'PathError'
    getRCFileVarsStub.rejects(pathError)
    getRCFileVarsStub.onThirdCall().returns({ THANKS: 'FOR ALL THE FISH' })
    const envs = await getEnvVarsLib.getEnvVars({ rc: { environments: ['production'] } })
    assert.isOk(envs)
    assert.lengthOf(Object.keys(envs), 1)
    assert.equal(envs.THANKS, 'FOR ALL THE FISH')
    assert.equal(getRCFileVarsStub.callCount, 3)
    assert.lengthOf(getRCFileVarsStub.args[2][0].environments, 1)
    assert.equal(getRCFileVarsStub.args[2][0].environments[0], 'production')
    assert.equal(getRCFileVarsStub.args[2][0].filePath, './.env-cmdrc.json')
  })

  it('should fail to find .rc file at default path', async (): Promise<void> => {
    const pathError = new Error()
    pathError.name = 'PathError'
    getRCFileVarsStub.rejects(pathError)
    try {
      await getEnvVarsLib.getEnvVars({ rc: { environments: ['production'] } })
      assert.fail('should not get here.')
    }
    catch (e) {
      assert.instanceOf(e, Error)
      assert.match(e.message, /failed to find/gi)
      assert.match(e.message, /\.rc file/gi)
      assert.match(e.message, /default paths/gi)
    }
  })

  it('should print failure to find .rc file to info for verbose', async (): Promise<void> => {
    logInfoStub = sinon.stub(console, 'info')
    const pathError = new Error()
    pathError.name = 'PathError'
    getRCFileVarsStub.rejects(pathError)
    try {
      await getEnvVarsLib.getEnvVars({ rc: { environments: ['production'] }, verbose: true })
      assert.fail('should not get here.')
    }
    catch {
      assert.equal(logInfoStub.callCount, 1)
    }
  })

  it('should fail to find environments at .rc file at default path', async (): Promise<void> => {
    const environmentError = new Error('Failed to find environments: for .rc file at path:')
    environmentError.name = 'EnvironmentError'
    getRCFileVarsStub.rejects(environmentError)
    try {
      await getEnvVarsLib.getEnvVars({ rc: { environments: ['bad'] } })
      assert.fail('should not get here.')
    }
    catch (e) {
      assert.instanceOf(e, Error)
      assert.match(e.message, /failed to find environments/gi)
      assert.match(e.message, /\.rc file at path/gi)
    }
  })

  it('should print failure to find environments in .rc file to info for verbose', async (): Promise<void> => {
    logInfoStub = sinon.stub(console, 'info')
    const environmentError = new Error('Failed to find environments: for .rc file at path:')
    environmentError.name = 'EnvironmentError'
    getRCFileVarsStub.rejects(environmentError)
    try {
      await getEnvVarsLib.getEnvVars({ rc: { environments: ['bad'] }, verbose: true })
      assert.fail('should not get here.')
    }
    catch {
      assert.equal(logInfoStub.callCount, 1)
    }
  })

  it('should find .rc file at custom path path', async (): Promise<void> => {
    getRCFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
    const envs = await getEnvVarsLib.getEnvVars({
      rc: { environments: ['production'], filePath: '../.custom-rc' },
    })
    assert.isOk(envs)
    assert.lengthOf(Object.keys(envs), 1)
    assert.equal(envs.THANKS, 'FOR ALL THE FISH')
    assert.equal(getRCFileVarsStub.callCount, 1)
    assert.lengthOf(getRCFileVarsStub.args[0][0].environments, 1)
    assert.equal(getRCFileVarsStub.args[0][0].environments[0], 'production')
    assert.equal(getRCFileVarsStub.args[0][0].filePath, '../.custom-rc')
  })

  it('should print custom .rc file path to info for verbose', async (): Promise<void> => {
    logInfoStub = sinon.stub(console, 'info')
    getRCFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
    await getEnvVarsLib.getEnvVars({
      rc: { environments: ['production'], filePath: '../.custom-rc' },
      verbose: true,
    })
    assert.equal(logInfoStub.callCount, 1)
  })

  it('should fail to find .rc file at custom path path', async (): Promise<void> => {
    const pathError = new Error('Failed to find .rc file at path:')
    pathError.name = 'PathError'
    getRCFileVarsStub.rejects(pathError)
    try {
      await getEnvVarsLib.getEnvVars({
        rc: { environments: ['production'], filePath: '../.custom-rc' },
      })
      assert.fail('should not get here.')
    }
    catch (e) {
      assert.instanceOf(e, Error)
      assert.match(e.message, /failed to find/gi)
      assert.match(e.message, /\.rc file at path/gi)
    }
  })

  it('should print failure to find custom .rc file path to info for verbose', async (): Promise<void> => {
    logInfoStub = sinon.stub(console, 'info')
    const pathError = new Error('Failed to find .rc file at path:')
    pathError.name = 'PathError'
    getRCFileVarsStub.rejects(pathError)
    try {
      await getEnvVarsLib.getEnvVars({
        rc: { environments: ['production'], filePath: '../.custom-rc' },
        verbose: true,
      })
      assert.fail('should not get here.')
    }
    catch {
      assert.equal(logInfoStub.callCount, 1)
    }
  })

  it('should fail to find environments for .rc file at custom path', async (): Promise<void> => {
    const environmentError = new Error('Failed to find environments: for .rc file at path: ')
    environmentError.name = 'EnvironmentError'
    getRCFileVarsStub.rejects(environmentError)
    try {
      await getEnvVarsLib.getEnvVars({
        rc: { environments: ['bad'], filePath: '../.custom-rc' },
      })
      assert.fail('should not get here.')
    }
    catch (e) {
      assert.instanceOf(e, Error)
      assert.match(e.message, /failed to find environments/gi)
      assert.match(e.message, /\.rc file at path/gi)
    }
  })

  it('should print failure to find environments for custom .rc file path to info for verbose',
    async (): Promise<void> => {
      logInfoStub = sinon.stub(console, 'info')
      const environmentError = new Error('Failed to find environments: for .rc file at path: ')
      environmentError.name = 'EnvironmentError'
      getRCFileVarsStub.rejects(environmentError)
      try {
        await getEnvVarsLib.getEnvVars({
          rc: { environments: ['bad'], filePath: '../.custom-rc' },
          verbose: true,
        })
        assert.fail('should not get here.')
      }
      catch {
        assert.equal(logInfoStub.callCount, 1)
      }
    },
  )

  it('should parse the env file from a custom path', async (): Promise<void> => {
    getEnvFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
    const envs = await getEnvVarsLib.getEnvVars({ envFile: { filePath: '../.env-file' } })
    assert.isOk(envs)
    assert.lengthOf(Object.keys(envs), 1)
    assert.equal(envs.THANKS, 'FOR ALL THE FISH')
    assert.equal(getEnvFileVarsStub.callCount, 1)
    assert.equal(getEnvFileVarsStub.args[0][0], '../.env-file')
  })

  it('should print path of .env file to info for verbose', async (): Promise<void> => {
    logInfoStub = sinon.stub(console, 'info')
    getEnvFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
    await getEnvVarsLib.getEnvVars({ envFile: { filePath: '../.env-file' }, verbose: true })
    assert.equal(logInfoStub.callCount, 1)
  })

  it('should fail to find env file at custom path', async (): Promise<void> => {
    getEnvFileVarsStub.rejects('Not found.')
    try {
      await getEnvVarsLib.getEnvVars({ envFile: { filePath: '../.env-file' } })
      assert.fail('should not get here.')
    }
    catch (e) {
      assert.instanceOf(e, Error)
      assert.match(e.message, /failed to find/gi)
      assert.match(e.message, /\.env file at path/gi)
    }
  })

  it('should print failure to find .env file path to info for verbose', async (): Promise<void> => {
    logInfoStub = sinon.stub(console, 'info')
    getEnvFileVarsStub.rejects('Not found.')
    try {
      await getEnvVarsLib.getEnvVars({ envFile: { filePath: '../.env-file' }, verbose: true })
      assert.fail('should not get here.')
    }
    catch {
      assert.equal(logInfoStub.callCount, 1)
    }
  })

  it(
    'should parse the env file from the default path if custom '
    + 'path not found and fallback option provided',
    async (): Promise<void> => {
      getEnvFileVarsStub.onFirstCall().rejects('File not found.')
      getEnvFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
      const envs = await getEnvVarsLib.getEnvVars({ envFile: { filePath: '../.env-file', fallback: true } })
      assert.isOk(envs)
      assert.lengthOf(Object.keys(envs), 1)
      assert.equal(envs.THANKS, 'FOR ALL THE FISH')
      assert.equal(getEnvFileVarsStub.callCount, 2)
      assert.equal(getEnvFileVarsStub.args[1][0], './.env')
    },
  )

  it(
    'should print multiple times for failure to find .env file and '
    + 'failure to find fallback file to infor for verbose',
    async (): Promise<void> => {
      logInfoStub = sinon.stub(console, 'info')
      getEnvFileVarsStub.onFirstCall().rejects('File not found.')
      getEnvFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
      await getEnvVarsLib.getEnvVars({ envFile: { filePath: '../.env-file', fallback: true }, verbose: true })
      assert.equal(logInfoStub.callCount, 2)
    },
  )

  it('should parse the env file from the default path', async (): Promise<void> => {
    getEnvFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
    const envs = await getEnvVarsLib.getEnvVars()
    assert.isOk(envs)
    assert.lengthOf(Object.keys(envs), 1)
    assert.equal(envs.THANKS, 'FOR ALL THE FISH')
    assert.equal(getEnvFileVarsStub.callCount, 1)
    assert.equal(getEnvFileVarsStub.args[0][0], './.env')
  })

  it('should print path of .env file to info for verbose', async (): Promise<void> => {
    logInfoStub = sinon.stub(console, 'info')
    getEnvFileVarsStub.returns({ THANKS: 'FOR ALL THE FISH' })
    await getEnvVarsLib.getEnvVars({ verbose: true })
    assert.equal(logInfoStub.callCount, 1)
  })

  it('should search all default env file paths', async (): Promise<void> => {
    getEnvFileVarsStub.throws('Not found.')
    getEnvFileVarsStub.onThirdCall().returns({ THANKS: 'FOR ALL THE FISH' })
    const envs = await getEnvVarsLib.getEnvVars()
    assert.isOk(envs)
    assert.lengthOf(Object.keys(envs), 1)
    assert.equal(envs.THANKS, 'FOR ALL THE FISH')
    assert.equal(getEnvFileVarsStub.callCount, 3)
    assert.isTrue(getEnvFileVarsStub.calledWithExactly('./.env.json'))
  })

  it('should fail to find env file at default path', async (): Promise<void> => {
    getEnvFileVarsStub.rejects('Not found.')
    try {
      await getEnvVarsLib.getEnvVars()
      assert.fail('should not get here.')
    }
    catch (e) {
      assert.instanceOf(e, Error)
      assert.match(e.message, /failed to find/gi)
      assert.match(e.message, /\.env file/gi)
      assert.match(e.message, /default paths/gi)
    }
  })

  it(
    'should print failure to find .env file at default paths to info for verbose',
    async (): Promise<void> => {
      logInfoStub = sinon.stub(console, 'info')
      getEnvFileVarsStub.rejects('Not found.')
      try {
        await getEnvVarsLib.getEnvVars({ verbose: true })
        assert.fail('should not get here.')
      }
      catch {
        assert.equal(logInfoStub.callCount, 1)
      }
    },
  )
})
