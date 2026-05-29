// import cors from "@elysiajs/cors";
// import { auth } from "@repo/auth/auth";
// import { Server as Engine } from "@socket.io/bun-engine";
// import { Elysia } from "elysia";
// import { Server } from "socket.io";

// const io = new Server();
// const engine = new Engine({

// });

// io.bind(engine);

// io.on("connection", (socket) => {
//   console.log("socket ");
// });

// const app = new Elysia()
//   .use(
//     cors({
//       origin: "http://localhost:3000",
//       credentials: true,
//       methods: ["*"],
//     }),
//   )
//   .macro({
//     auth: {
//       async resolve({ status, request: { headers } }) {
//         const session = await auth.api.getSession({
//           headers,
//         });
//         if (!session) {
//           return status(401);
//         }
//         return {
//           user: session.user,
//           session: session.session,
//         };
//       },
//     },
//   })
//   .all(
//     "/socket.io/",
//     ({ request, server }) => {
//       if (!server) {
//         console.log("no server");
//         return;
//       }
//       console.log("called", request);
//       return engine.handleRequest(request, server);
//     },
//     { auth: true },
//   )
//   .listen({
//     port: 3002,
//     ...engine.handler(),
//   });

// console.log(
//   `🦊 Elysia Websocket Server SOCKETIO is running at ${app.server?.hostname}:${app.server?.port}`,
// );
import cors from "@elysiajs/cors";
import { auth } from "@repo/auth/auth";
import { Server as Engine } from "@socket.io/bun-engine";
import { Elysia } from "elysia";
import { Server } from "socket.io";

const io = new Server({});

const engine = new Engine({
  path: "/socket.io/",
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },

  async allowRequest(request) {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      throw "Unauthorized";
    }
  },
});

io.bind(engine);

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
});

io.engine.on("connection_error", (err) => {
  console.error("Socket.IO connection error:", err);
});

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
    }),
  )
  .all("/socket.io/", ({ request, server }) => {
    if (!server) {
      return new Response("Internal server error", { status: 500 });
    }

    return engine.handleRequest(request, server);
  })
  .listen({
    port: 3002,
    ...engine.handler(),
  });

console.log(
  `🦊 Elysia Socket.IO server running at ${app.server?.hostname}:${app.server?.port}`,
);
