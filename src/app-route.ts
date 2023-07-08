import { IncomingMessage, ServerResponse } from "http";
import type { ValueOrPromise } from "./types.js";
import type { NextResponse } from "next/server.js";
import type { NextRequest } from "next/server.js";
import { Socket } from "net";
import { Readable } from "node:stream";

export type AppRouteRequestHandler = (
  req: NextRequest
) => ValueOrPromise<NextResponse | Response>;

// Intended API
// ```
// const app = express();
// const loading = payload.init({ express: app });
// export const GET: AppRouteRequestHandler = async (req) => {
//   await loading;
//   return (await handleNextRequest(req, app)) || NextResponse.next();
// };
// ```

export const handleNextRequest = (
  req: NextRequest | Request,
  app: Express.Application
) => {
  // Create mock socket
  const socket = new Socket();

  // Transform NextRequest to IncomingMessage
  const incoming = new IncomingMessage(socket);
  req.headers.forEach((value, name) => {
    incoming.headers[name] = value;
  });
  incoming.method = req.method;
  incoming.url = req.url;
  if (req.body) {
    const bodyStream = Readable.from([
      typeof req.body === "string" ? req.body : JSON.stringify(req.body),
    ]);
    incoming.push(bodyStream);
    incoming.push(null); // Signal the end of the stream
  }

  const response = new ServerResponse(incoming);
  return new Promise<Response>((resolve, reject) => {
    // TODO: overwrite response.end instead
    response.json = (body) => {
      const res = new Response(JSON.stringify(body));
      res.headers.set("Content-Type", "application/json");
      // TODO: set other headers
      resolve(res);
    };

    app.handle(incoming, res, (err) => {
      // This should never happen?
      if (err) {
        reject(err);
      } else {
        const response = new Response(
          JSON.stringify({ message: "This is impossible?" })
        );
        response.headers.set("Content-Type", "application/json");
        resolve(response);
      }
    });
  });
};
