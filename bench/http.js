import { createServer } from "http";

createServer((req, res) => {
  req.one = true;
  req.two = true;
  if (req.url === "/") return res.end("Hello");
  else if (req.url.startsWith("/user")) {
    return res.end(`User: 123`);
  }
  res.statusCode = 404;
  res.end("not found");
}).listen(3000);
