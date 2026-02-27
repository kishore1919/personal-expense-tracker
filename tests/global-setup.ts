import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import net from 'net';

const execAsync = promisify(exec);

/**
 * Check if a port is in use
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
  const authPortInUse = await isPortInUse(9099);
  const firestorePortInUse = await isPortInUse(8080);
  
  if (authPortInUse && firestorePortInUse) {
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
  
  // Start emulator in detached mode
  const emulator = spawn(
    'bunx',
    ['firebase', 'emulators:start', '--only', 'auth,firestore', '--project', 'expense-tracker-test'],
    {
      detached: true,
      stdio: 'pipe',
      shell: true,
    }
  );
  
  // Handle emulator output
  emulator.stdout?.on('data', (data) => {
    const output = data.toString();
    if (output.includes(' Emulator')) {
      console.log('   ' + output.trim());
    }
  });
  
  emulator.stderr?.on('data', (data) => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      console.error('   Emulator Error:', output.trim());
    }
  });
  
  // Wait for emulator to be ready
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds timeout
  
  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const authReady = await isPortInUse(9099);
    const firestoreReady = await isPortInUse(8080);
    
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
    }
  }
  
  console.error('\n❌ Firebase Emulator failed to start within 60 seconds');
  console.error('   This could be due to:');
  console.error('   - Slow system performance');
  console.error('   - Firewall blocking ports 9099/8080');
  console.error('   - Another process using those ports');
  console.error('\n🔄 Try starting the emulator manually first:');
  console.error('   bun run emulator:start');
  console.error('\n📝 Then run tests in another terminal:');
  console.error('   bun run test:e2e\n');
  
  // Kill the emulator process if it's hanging
  try {
    emulator.kill();
  } catch {
    // Ignore
  }
  
  throw new Error('Firebase Emulator failed to start. See instructions above.');
}
