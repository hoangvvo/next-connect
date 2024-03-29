import express from "express";

function one(req, res, next) {
  req.one = true;
  next();
}

function two(req, res, next) {
  req.two = true;
  next();
}

express()
  .use(one, two)
  .get("/", (req, res) => res.send("Hello"))
  .get("/user/:id", (req, res) => {
    res.end(`User: ${req.params.id}`);
  })
  .listen(3000);
