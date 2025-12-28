import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { ExecutorContext } from '@nx/devkit';

import executor from './deploy';
import { DeployExecutorSchema } from './schema';

describe('Deploy Executor', () => {
  const mockWorkspaceRoot = '/tmp/test-workspace';
  const mockProjectRoot = 'apps/test-app';
  const mockOutputPath = 'dist/apps/test-app';
  const mockBuildOutputPath = path.join(mockWorkspaceRoot, mockOutputPath);
  const mockVercelOutputDir = path.join(
    mockWorkspaceRoot,
    mockProjectRoot,
    '.vercel',
    'output'
  );

  const options: DeployExecutorSchema = {
    outputPath: mockOutputPath,
    prod: false,
  };

  const context: ExecutorContext = {
    root: mockWorkspaceRoot,
    cwd: process.cwd(),
    isVerbose: false,
    projectName: 'test-app',
    projectGraph: {
      nodes: {},
      dependencies: {},
    },
    projectsConfigurations: {
      projects: {
        'test-app': {
          root: mockProjectRoot,
        },
      },
      version: 2,
    },
    nxJsonConfiguration: {},
  };

  let execFileSyncSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create mock build output directory
    fs.mkdirSync(mockBuildOutputPath, { recursive: true });
    fs.writeFileSync(
      path.join(mockBuildOutputPath, 'index.html'),
      '<html></html>'
    );

    // Ensure project root exists
    fs.mkdirSync(path.join(mockWorkspaceRoot, mockProjectRoot), {
      recursive: true,
    });

    // Mock execFileSync to avoid actual Vercel CLI calls
    execFileSyncSpy = jest
      .spyOn(childProcess, 'execFileSync')
      .mockReturnValue('https://test-deployment.vercel.app');
  });

  afterEach(() => {
    // Cleanup
    fs.rmSync(mockWorkspaceRoot, { recursive: true, force: true });
    execFileSyncSpy.mockRestore();
  });

  it('should create .vercel/output structure', async () => {
    const output = await executor(options, context);

    expect(output.success).toBe(true);
    expect(fs.existsSync(mockVercelOutputDir)).toBe(true);
    expect(fs.existsSync(path.join(mockVercelOutputDir, 'static'))).toBe(true);
    expect(fs.existsSync(path.join(mockVercelOutputDir, 'config.json'))).toBe(
      true
    );
  });

  it('should copy build output to static directory', async () => {
    await executor(options, context);

    const staticDir = path.join(mockVercelOutputDir, 'static');
    expect(fs.existsSync(path.join(staticDir, 'index.html'))).toBe(true);
  });

  it('should create config.json with SPA routing', async () => {
    await executor(options, context);

    const configPath = path.join(mockVercelOutputDir, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    expect(config.version).toBe(3);
    expect(config.routes).toContainEqual({ handle: 'filesystem' });
    expect(config.routes).toContainEqual({
      src: '/(.*)',
      dest: '/index.html',
    });
  });

  it('should call vercel CLI with correct arguments', async () => {
    await executor(options, context);

    expect(execFileSyncSpy).toHaveBeenCalledWith(
      'vercel',
      expect.arrayContaining(['deploy', '--prebuilt', '--yes']),
      expect.objectContaining({
        cwd: path.join(mockWorkspaceRoot, mockProjectRoot),
      })
    );
  });

  it('should include --prod flag when prod option is true', async () => {
    await executor({ ...options, prod: true }, context);

    expect(execFileSyncSpy).toHaveBeenCalledWith(
      'vercel',
      expect.arrayContaining(['deploy', '--prebuilt', '--prod', '--yes']),
      expect.anything()
    );
  });

  it('should fail if build output does not exist', async () => {
    // Remove build output
    fs.rmSync(mockBuildOutputPath, { recursive: true });

    const output = await executor(options, context);

    expect(output.success).toBe(false);
  });

  it('should fail if project name is not in context', async () => {
    const noProjectContext = { ...context, projectName: undefined };

    const output = await executor(options, noProjectContext);

    expect(output.success).toBe(false);
  });
});
