import { test } from "tap";
import { spawn } from "node:child_process";

test("real server", async (t) => {
  t.before(async () => {
    await new Promise((resolve) => {
      const child = spawn("rm", ["-rf", "test/next/.next"], {});
      child.on("exit", resolve);
    });
  });

  const nextApp = await next({ dir: "test/next" });
  t.teardown(nextApp.close);
  console.log("next url", nextApp.address);

  const query = await fetch(nextApp.address + "/query?message=bar").then((r) =>
    r.json()
  );
  t.same(query, { message: "bar" });

  const headers = await fetch(nextApp.address + "/headers", {
    headers: {
      example: "bar",
      Uppercase: "BAR",
      "X-Custom": "custom",
    },
  }).then((r) => r.json());
  t.has(headers, {
    example: "bar",
    uppercase: "BAR",
    "x-custom": "custom",
  });

  const body = await fetch(nextApp.address + "/body", {
    headers: { "content-type": "application/json" },
    method: "POST",
    body: JSON.stringify({ message: "bar" }),
  }).then((r) => r.json());
  t.same(body, { message: "bar" });

  const bodyUrlEncoded = await fetch(nextApp.address + "/body", {
    method: "POST",
    // url encoded
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "message=bar",
  }).then((r) => r.json());
  t.same(bodyUrlEncoded, { message: "bar" });

  // TODO
  const sendFile = await fetch(nextApp.address + "/end", {}).then((r) =>
    r.text()
  );
  t.same(sendFile, "barfile");
});

// Cannot run next() from 'next' because of ts transpilation
async function next({ dir }: { dir: string }) {
  return new Promise<{ close: () => void; address: string }>(
    (resolve, reject) => {
      // Start server in child process
      let started = false;

      // TODO: random port?
      console.log("starting next", dir);
      const child = spawn("npx", ["next"], {
        cwd: process.cwd() + "/" + dir,
        env: {
          PATH: process.env.PATH,
          PORT: Math.floor(Math.random() * 50000 + 10000).toString(),
        },
        detached: false,
      });

      child.stdout.setEncoding("utf8");
      child.stdout.on("data", async function (data) {
        // console.log("|", data);
        if (!started && data.includes("started server on")) {
          started = true;
          resolve({
            address: data.split("url:")[1].trim(),
            close: kill,
          });
        }
      });
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", function (data) {
        console.log("stderr: ", data);
      });

      function kill() {
        return new Promise<void>((resolve) => {
          if (child.exitCode === null) {
            child.on("exit", resolve);
            child.on("close", (d) => console.log("close", d));
            child.on("error", (d) => console.log("error", d));
          } else {
            return resolve();
          }

          child.kill();
          setTimeout(() => {
            if (child.exitCode === null) {
              console.log("SIGKILL");
              child.kill("SIGKILL");
            }
          }, 2000);
        });
      }
    }
  );
}
