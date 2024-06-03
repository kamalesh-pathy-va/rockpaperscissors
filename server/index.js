import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { randomUUID } from "node:crypto";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    connectionStateRecovery: {
      maxDisconnectionDuration: 5 * 60 * 1000
    }
  });

  let game = {};

  io.on("connection", (socket) => {
    console.log(socket.id);

    socket.on('user:getid', () => {
      socket.emit('user:id', socket.id);
    });

    const createRoom = (privateRoom) => {
      const newRoomID = randomUUID();
      game[newRoomID] = {
        'players': [{
          'playerID': socket.id,
          'option': 'r',
          'optionLock': false,
        }],
        'vacent': true,
        'private': privateRoom,
      };
      return newRoomID;
    }

    socket.on('room:join', (cb) => {
      Object.keys(game).forEach(key => {
        if (!game[key].private && game[key].vacent) {
          game[key].vacent = false;
          const playerDetails = {
            'playerID': socket.id,
            'option': 'r',
            'optionLock': false,
          }
          game[key].players.push(playerDetails);
          socket.join(key);
          cb(key);
          return;
        }
      })
      const newRoomID = createRoom(false); //Bool for private rooms
      cb(newRoomID);
    });

    socket.on('room:create', (cb) => {
      const newRoomID = createRoom(true);
      cb(newRoomID);
    });

    socket.on('room:leave', (roomID, userID, cb) => {
      game[roomID].vacent = true;
      const playerPos = game[roomID].players.indexOf(userID);
      if (playerPos > -1) {
        game[roomID].players.splice(playerPos, 1);
      }
      cb();
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});