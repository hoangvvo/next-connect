import type {
  Application as ExpressApplication,
  Response as ExpressResponse,
  Request as ExpressRequest,
} from "express";
import type { NextResponse } from "next/server.js";
import type { NextRequest } from "next/server.js";
import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

import type { ValueOrPromise } from "./types.js";

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
  app: ExpressApplication
) => {
  // Transform NextRequest to IncomingMessage
  const incoming = new IncomingMessage(new Socket()) as ExpressRequest;
  incoming.method = req.method;
  incoming.url = req.url;
  for (const [name, value] of Object.entries(req.headers)) {
    incoming.headers[name] = value;
  }

  const requestBody = await req.text();
  if (requestBody) {
    incoming.push(requestBody);
    incoming.push(null);
  }

  // Prepare a ServerResponse
  const response = new ServerResponse(incoming) as ExpressResponse;

  // Gather all streamed body chunks and include them in the response
  const stream: Buffer[] = [];

  // Needed for res.sendFile()
  response.write = function (
    chunk: any,
    encoding?: BufferEncoding | ((error: Error) => void)
  ) {
    if (encoding)
      chunk = Buffer.from(
        chunk,
        typeof encoding === "string" ? encoding : undefined
      );
    if (Buffer.isBuffer(chunk)) stream.push(chunk);
    else
      console.log(
        "handleNextRequest this type of response body is not supported"
      );

    return true;
  };

  return new Promise<Response>((resolve, reject) => {
    response.end = function (
      chunk: any,
      encoding?: BufferEncoding | (() => void)
    ) {
      // Append headers one by one resolving the special cases around cookie & set-cookie
      const headers = new Headers();
      const object = this.getHeaders();
      for (const key in object) {
        const value = object[key];
        if (Array.isArray(value)) {
          for (const item of value) {
            headers.append(key, item);
          }
        } else headers.append(key, value as string);
      }

      // Body must fallback to null, otherwise error in case of status 304
      let body: string | null = null;
      if (chunk)
        stream.push(
          Buffer.from(
            chunk,
            typeof encoding === "string" ? encoding : undefined
          )
        );
      if (stream.length) body = Buffer.concat(stream).toString();
      resolve(new Response(body, { status: this.statusCode, headers }));
      return response;
    };

    app(incoming, response, (err) => {
      // This should never happen?
      if (err) {
        console.log("handleNextRequest.error", err.message);
        reject(err);
      } else {
        if (response.headersSent)
          return console.log("handleNextRequest.headersSent");

        // This is arbitrary
        response.statusCode = 404;
        response.json({ message: "Not found" });
      }
    });
  });
};
