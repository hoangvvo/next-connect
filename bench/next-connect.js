import { createServer } from "http";
import { createRouter } from "next-connect";

function one(req, res, next) {
  req.one = true;
  next();
}

function two(req, res, next) {
  req.two = true;
  next();
}

createServer(
  createRouter()
    .use(one, two)
    .get("/", (req, res) => res.end("Hello"))
    .get("/user/:id", (req, res) => {
      res.end(`User: ${req.params.id}`);
    })
    .handler()
).listen(3000);
