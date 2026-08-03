import { startAnalyzeWorker } from './analyzeWorker';
import { startQueryWorker } from './queryWorker';

const analyzeWorker = startAnalyzeWorker();
const queryWorker = startQueryWorker();

console.log('Workers started: document-analyze, rag-query');

process.on('SIGTERM', async () => {
  await Promise.all([analyzeWorker.close(), queryWorker.close()]);
  process.exit(0);
});