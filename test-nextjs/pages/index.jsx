import nc from "next-connect";
import { useEffect, useState } from "react";

export default function Index() {
  const [res, setRes] = useState();
  useEffect(() => {
    fetch("/api/hello")
      .then((res) => res.text())
      .then(setRes);
  }, []);
  return JSON.stringify(res);
}

export const getServerSideProps = ({ req, res }) => {
  nc()
    .use((req, res, next) => {
      console.log("I'm called at", req.url);
      next();
    })
    .run(req, res);
  return {
    props: {},
  };
};
