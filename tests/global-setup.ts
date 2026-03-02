import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

/**
 * Check if a port is ready (something is listening on it)
 */
async function isPortReady(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();

    socket.setTimeout(1000);

    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });

    socket.once('error', () => {
      resolve(false);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, '127.0.0.1');
  });
}

/**
 * Check if a port is in use (for detecting already running emulators)
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}

/**
 * Check if Java is installed
 */
async function checkJava(): Promise<boolean> {
  try {
    await execAsync('java -version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Global setup - starts Firebase emulator before tests
 */
export default async function globalSetup() {
  console.log('🔧 Setting up test environment...');
  
  // Check if emulator is already running
  const authPortReady = await isPortReady(9099);
  const firestorePortReady = await isPortReady(8080);

  if (authPortReady && firestorePortReady) {
    console.log('✅ Firebase Emulator already running');
    console.log('   Auth: http://127.0.0.1:9099');
    console.log('   Firestore: http://127.0.0.1:8080');
    return;
  }
  
  // Check if Java is installed
  const hasJava = await checkJava();
  if (!hasJava) {
    console.error('\n❌ ERROR: Java is required to run Firebase Emulator but is not installed.');
    console.error('\n📋 To fix this, install Java:');
    console.error('   Windows: winget install Microsoft.OpenJDK.17');
    console.error('   macOS: brew install openjdk@17');
    console.error('   Linux: sudo apt install default-jdk');
    console.error('\n🔄 Alternatively, start the emulator manually before running tests:');
    console.error('   bun run emulator:start');
    console.error('\n⚠️  Or run tests without emulator (will use production Firebase):');
    console.error('   Remove NEXT_PUBLIC_FIREBASE_EMULATOR from .env.test\n');
    
    // Don't throw error - let tests try to run without emulator
    console.log('⚠️  Continuing without emulator - tests may fail or use production Firebase\n');
    return;
  }
  
  console.log('🚀 Starting Firebase Emulator...');
  console.log('   This may take a moment on first run...');

  // Use 'bun run' with the npm script to ensure proper PATH resolution
  // This works better on Windows than spawning bunx directly
  const emulator = spawn(
    'bun',
    ['run', 'emulator:start'],
    {
      detached: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      windowsHide: true,
      cwd: process.cwd(), // Ensure we're in the project directory
    }
  );

  // Handle emulator output
  emulator.stdout?.on('data', (data) => {
    const output = data.toString();
    console.log('   ' + output.trim());
  });

  emulator.stderr?.on('data', (data) => {
    const output = data.toString();
    console.log('   [stderr] ' + output.trim());
  });

  emulator.on('error', (err) => {
    console.error('   ❌ Failed to start emulator:', err.message);
  });

  emulator.on('close', (code) => {
    if (code !== null && code !== 0) {
      console.error(`   ❌ Emulator exited with code ${code}`);
    }
  });
  
  // Wait for emulator to be ready (increased timeout to 120 seconds)
  let attempts = 0;
  const maxAttempts = 120; // 120 seconds timeout for slow systems

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));

    const authReady = await isPortReady(9099);
    const firestoreReady = await isPortReady(8080);

    if (authReady && firestoreReady) {
      console.log('✅ Firebase Emulator ready');
      console.log('   Auth: http://127.0.0.1:9099');
      console.log('   Firestore: http://127.0.0.1:8080');
      console.log('   UI: http://127.0.0.1:4000');
      return;
    }

    attempts++;
    if (attempts % 10 === 0) {
      console.log(`⏳ Waiting for emulator... (${attempts}/${maxAttempts})`);
      console.log(`   Auth port (9099): ${authReady ? '✅' : '⏳'}`);
      console.log(`   Firestore port (8080): ${firestoreReady ? '✅' : '⏳'}`);
    }
  }

  console.warn('\n⚠️  Firebase Emulator failed to start within 120 seconds');
  console.warn('   This could be due to:');
  console.warn('   - Slow system performance');
  console.warn('   - Firewall blocking ports 9099/8080');
  console.warn('   - Another process using those ports');
  console.warn('   - Java not properly installed');
  console.warn('   - Firestore emulator JAR download failed (network issue)');
  console.warn('\n🔄 Try starting the emulator manually first:');
  console.warn('   bun run emulator:start');
  console.warn('\n📝 Or download the emulator manually:');
  console.warn('   firebase setup:emulators:firestore');
  console.warn('\n⚠️  Continuing without emulator - tests will use configured Firebase\n');

  // Kill the emulator process if it's hanging
  try {
    emulator.kill('SIGINT');
  } catch {
    // Ignore
  }

  // Don't throw - let tests run without emulator
  console.log('⚠️  Running tests without Firebase Emulator');
}
