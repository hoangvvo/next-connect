import { IncomingMessage, ServerResponse } from "http";
import type { ValueOrPromise } from "./types.js";
import type { NextResponse } from "next/server.js";
import type { NextRequest } from "next/server.js";
import { Socket } from "net";

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

export const handleNextRequest = async (
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

  const text = await req.text();
  if (text) {
    incoming.push(text);
    incoming.push(null);
  }

  const response = new ServerResponse(incoming);
  return new Promise<Response>((resolve, reject) => {
    const nativeEnd = response.end;
    response.end = (body, encoding) => {
      const res = new Response(body);
      res.headers.set("Content-Type", "application/json");
      resolve(res);
      nativeEnd(body, encoding);
    };

    app.handle(incoming, response, (err) => {
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
