import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import styles from "../styles/styles.module.css";

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Next.js + next-connect</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <a href="https://github.com/hoangvvo/next-connect/tree/main/examples/nextjs">
            Next.js + next-connect
          </a>
        </h1>
        <p className={styles.description}>
          Get started by running{" "}
          <code className={styles.code}>npm i next-connect</code>
        </p>
        <div className={styles.grid}>
          <Link href="/gssp-users" className={styles.card}>
            <h2>GetServerSideProps</h2>
            <p>Use next-connect in getServerSideProps</p>
          </Link>

          <Link href="/api-routes" className={styles.card}>
            <h2>API Routes</h2>
            <p>Use next-connect in API Routes</p>
          </Link>

          <Link href="/edge-api-routes" className={styles.card}>
            <h2>Edge API Routes</h2>
            <p>Use next-connect in Edge API Routes</p>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Home;
