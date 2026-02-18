import { spawn } from 'child_process';

/**
 * Global teardown - stops Firebase emulator after tests
 */
export default async function globalTeardown() {
  console.log('\n🛑 Tearing down test environment...');
  
  try {
    // Try to stop the emulator gracefully
    const stopProcess = spawn('bunx', ['firebase', 'emulators:stop'], {
      stdio: 'pipe',
    });
    
    await new Promise<void>((resolve) => {
      stopProcess.on('close', () => {
        console.log('✅ Firebase Emulator stopped');
        resolve();
      });
      
      stopProcess.on('error', () => {
        // Emulator might not be running, that's okay
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  } catch (e) {
    // Emulator might not be running, ignore error
    console.log('ℹ️  Emulator already stopped or not running');
  }
  
  console.log('✅ Test environment cleaned up');
}
