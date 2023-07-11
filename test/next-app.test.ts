import { test } from "tap";
import { execSync, spawn } from "node:child_process";

test("next", async (t) => {
  let nextApp: { close: () => void; address: string };
  t.before(async () => {
    execSync("rm -rf test/next/.next");
    nextApp = await next({ dir: "test/next" });
    t.teardown(nextApp.close);
  });

  t.test("query", async (t) => {
    const query = await fetch(nextApp.address + "/query?message=bar").then(
      (r) => r.json()
    );
    t.same(query, { message: "bar" });
  });

  t.test("headers", async (t) => {
    const headers = new Headers({
      example: "one",
      Example: "two",
      cookie: "one",
      Cookie: "two",
      "set-cookie": "one",
      "Set-Cookie": "two",
      "user-agent": "one",
      "User-Agent": "two",
    });
    headers.append("example", "three");
    headers.append("Example", "four");
    headers.append("cookie", "three");
    headers.append("Cookie", "four");
    headers.append("set-cookie", "three");
    headers.append("Set-Cookie", "four");
    headers.append("user-agent", "three");
    headers.append("User-Agent", "four");
    const r = await fetch(nextApp.address + "/headers", { headers });
    t.has(await r.json(), {
      example: "one, two, three, four",
      cookie: "one; two; three; four",
      "set-cookie": "one, two, three, four",
      "user-agent": "one, two, three, four",
    });
  });

  t.test("body", async (t) => {
    const body = await fetch(nextApp.address + "/body", {
      headers: { "content-type": "application/json" },
      method: "POST",
      body: JSON.stringify({ message: "bar" }),
    }).then((r) => r.json());
    t.same(body, { message: "bar" });
  });

  t.test("bodyUrlEncoded", async (t) => {
    const bodyUrlEncoded = await fetch(nextApp.address + "/body", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "message=bar",
    }).then((r) => r.json());
    t.same(bodyUrlEncoded, { message: "bar" });
  });

  t.test("end", async (t) => {
    const send = await fetch(nextApp.address + "/end?send=1");
    t.same(send.headers.get("content-type"), "text/html; charset=utf-8");
    const sendBody = await send.text();
    t.same(sendBody, "<!DOCTYPE html>send\n");
  });

  t.test("json", async (t) => {
    const json = await fetch(nextApp.address + "/end?json=1");
    t.same(json.headers.get("content-type"), "application/json; charset=utf-8");
    const jsonBody = await json.json();
    t.same(jsonBody, { message: "Hello" });
  });

  t.test("sendFile", async (t) => {
    const sendFileTxt = await fetch(nextApp.address + "/end?sendFile=txt", {});
    t.same(
      sendFileTxt.headers.get("content-type"),
      "text/plain; charset=UTF-8"
    );
    const sendFileTxtBody = await sendFileTxt.text();
    t.same(sendFileTxtBody, "sendFile");

    const sendFileHtml = await fetch(
      nextApp.address + "/end?sendFile=html",
      {}
    );
    t.same(
      sendFileHtml.headers.get("content-type"),
      "text/html; charset=UTF-8"
    );
    const sendFileHtmlBody = await sendFileHtml.text();
    t.same(sendFileHtmlBody, "<!DOCTYPE html>sendFile\n");

    const notFound = await fetch(nextApp.address + "/end?notFound=1");
    t.same(
      notFound.headers.get("content-type"),
      "application/json; charset=utf-8"
    );
    const notFoundBody = await notFound.json();
    t.same(notFoundBody, { message: "Not found" });
  });
});

// Cannot run next() from 'next' because of ts transpilation
async function next({ dir }: { dir: string }) {
  return new Promise<{ close: () => void; address: string }>((resolve) => {
    // Start server in child process
    let started = false;

    // TODO: random port?
    const child = spawn("../../node_modules/.bin/next", {
      cwd: process.cwd() + "/" + dir,
      env: {
        PATH: process.env.PATH,
        PORT: Math.floor(Math.random() * 50000 + 10000).toString(),
      },
      detached: false,
    });

    // Don't need input at all
    child.stdin.end();

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
      console.log(dir, "stderr", data);
    });

    async function kill() {
      await new Promise<void>((resolve) => {
        if (child.exitCode === null) {
          child.on("exit", resolve);
        } else {
          return resolve();
        }

        child.kill();
        setTimeout(() => {
          if (child.exitCode === null) {
            console.log(dir, "SIGKILL");
            child.kill("SIGKILL");
          }
        }, 2000);
      });

      execSync("pkill -f next/dist/compiled/jest-worker/processChild.js");
    }
  });
}
