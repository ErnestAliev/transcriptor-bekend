import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env, validateEnv } from "./config/env.js";

async function bootstrap() {
  validateEnv();
  await connectDatabase();

  app.listen(env.port, () => {
    console.log(`API ready on http://localhost:${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
