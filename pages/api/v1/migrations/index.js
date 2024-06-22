import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database.js";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();
  let db = dbClient;

  const defaultMigrationOptions = {
    dbClient: db,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method === "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);
    try {
      db;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await dbClient.end();
    }
    return response.status(200).json(pendingMigrations);
  }

  if (request.method === "POST") {
    const migrateMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    const databaseMaxConnectionsResult = await database.query(
      "SHOW max_connections;",
    );
    const databaseMaxConnectionsValue =
      databaseMaxConnectionsResult.rows[0].max_connections;
    const databaseName = process.env.POSTGRES_DB;
    const databaseOpenedConnectionsResult = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });

    const databaseOpenedConnectionsValue =
      databaseOpenedConnectionsResult.rows[0].count;
    console.log(databaseOpenedConnectionsValue);
    try {
      db;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      await dbClient.end();
    }

    if (migrateMigrations.length > 0) {
      return response.status(201).json({
        ...migrateMigrations,
        max: databaseMaxConnectionsValue,
        open: databaseOpenedConnectionsValue,
      });
    }
    return response.status(200).json(migrateMigrations);
  }

  return response.status(405).end();
}
