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

    const createRoom = (privateRoom) => {
      const newRoomID = randomUUID();
      console.log('Called createRoom' + newRoomID);
      game[newRoomID] = {
        'players': [],
        'vacent': true,
        'private': privateRoom,
      };
      return newRoomID;
    };

    const leaveRoom = (userID, roomID) => {
      console.log('exiting Room: ' + roomID);
      if (game[roomID] !== undefined) {
        game[roomID]['vacent'] = true;
        let position = 0;
        for (let i = 0; i < game[roomID]['players'].length; i++) {
          if (game[roomID]['players'][i]['playerID'] == userID) {
            position = i;
            break;
          }
        }
        game[roomID]['players'].splice(position, 1);
        if (game[roomID]['players'].length == 0) {
          delete game[roomID];
        }
      }
      console.log('game Object');
      console.log(game);
    };

    socket.on('room:get', (cb) => {
      let roomFound = false;
      Object.keys(game).forEach(key => {
        if (!game[key]['private'] && game[key]['vacent']) {
          if (game[key]['players'].length > 0) {
            game[key]['vacent'] = false;
          }
          roomFound = true;
          cb(key);
          return;
        }
      });
      if (!roomFound) {
        const newRoomID = createRoom(false); //Bool for private rooms
        cb(newRoomID);
      }
    })

    socket.on('room:join', (roomID, cb) => {
      const playerDetails = {
        'playerID': socket.id,
        'option': 'r',
        'optionLock': false,
      }
      if (game[roomID]['players'].length < 2) {
        if (game[roomID]['players'].length === 1 && game[roomID]['players'][0]['playerID'] != playerDetails['playerID']) {
          game[roomID]['players'].push(playerDetails);
          socket.join(roomID);
          cb('ok');
        }
        if (game[roomID]['players'].length === 0) {
          game[roomID]['players'].push(playerDetails);
          socket.join(roomID);
          cb('ok');
        }
      } else {
        cb('full');
      }
      console.log(game);
    });

    socket.on('room:create', (cb) => {
      const newRoomID = createRoom(true);
      cb(newRoomID);
    });

    socket.on('room:leave', (roomID, userID, cb) => {
      leaveRoom(userID, roomID);
      cb();
    });

    socket.on('disconnecting', () => {
      const sData = socket.rooms.values();
      if (socket.rooms.size == 2){
        leaveRoom(sData.next().value, sData.next().value);
      }
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