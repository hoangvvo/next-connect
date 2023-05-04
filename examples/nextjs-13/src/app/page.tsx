import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>
        <a href="https://github.com/hoangvvo/next-connect/tree/main/examples/nextjs-13/src/app/api">
          App Router
        </a>{" "}
        example
      </h1>
      <p>
        Open your devtool (<code>F12</code>) and try the following snippets.
      </p>
      <h2>
        <code className={styles.code}>POST /api/users</code>
        <span> - Create a user</span>
      </h2>
      <div className={styles.snippet}>
        <pre>{`await fetch("/api/users", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ name: "Jane Doe", age: 18 }),
}).then((res) => res.json());
`}</pre>
      </div>
      <h2>
        <code className={styles.code}>GET /api/users</code>
        <span> - Get all users</span>
      </h2>
      <div className={styles.snippet}>
        <pre>{`await fetch("/api/users").then((res) => res.json());
`}</pre>
      </div>
      <h2>
        <code className={styles.code}>GET /api/users/:id</code>
        <span> - Get a single user</span>
      </h2>
      <div className={styles.snippet}>
        <pre>
          {`await fetch("/api/users/`}
          <span className={styles.code}>some-id</span>
          {`").then(res => res.json());
`}
        </pre>
      </div>
    </main>
  );
}
