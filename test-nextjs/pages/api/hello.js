import nc from "next-connect";

const handler = nc().get((req, res) => res.send("hello"));

export default handler;
