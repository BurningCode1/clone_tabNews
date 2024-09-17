const { exec } = require("node:child_process");

function checkConnection() {
  exec("docker exec postgres-dev pg_isready --host localhost", handleReturn);

  function handleReturn(error, stdout) {
    if (stdout.search("accepting connections") === -1) {
      process.stdout.write(".");
      checkConnection();
      return;
    }
    console.log("\n🟢 Postgres esta pronto e aceitando conexões");
  }
}

process.stdout.write("\n\n🔴 Aguardando Postgres aceitar conexões\n");
checkConnection();
