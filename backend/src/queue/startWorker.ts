// Workers are deprecated in favor of synchronous inference calls.
// Keeping this file to prevent script breakages.
console.log('Workers are no longer needed, using sync pipeline.');

process.on('SIGTERM', async () => {
  process.exit(0);
});