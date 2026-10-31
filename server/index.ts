import { createApp } from './app';
import { getEnv } from './config/env';

const env = getEnv();
const app = createApp({ env });

const server = app.listen(env.PORT, () => {
  console.log(`GatherWise API server running on port ${env.PORT} (${env.NODE_ENV})`);
  console.log(`Capabilities: AI=${Boolean(env.GEMINI_API_KEY)}, Weather=true, Cloud=false`);
});

export default server;
