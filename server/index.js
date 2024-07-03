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
        // 'vacent': true,
        'private': privateRoom,
      };
      return newRoomID;
    };

    const joinRoom = (roomID, player_name, cb) => {
      const playerDetails = {
        'name': player_name,
        'playerID': socket.id,
        'option': 'r',
        'optionLock': false,
      }

      // game[roomID]['players'].forEach(player => {
      //   if (player['playerID'] != playerDetails['playerID']) {
      //     if (game[roomID]['players'].length < 2) {
      //       game[roomID]['players'].push(playerDetails);
      //       socket.join(roomID);
      //       cb('ok');
      //     } else {
      //       cb('full');
      //     }
      //   } else {
      //     cb('ingame');
      //   }
      // });

      if (game[roomID]['players'].length < 2) { //See if there is no more than 2 players.
        if (game[roomID]['players'].length === 1 && game[roomID]['players'][0]['playerID'] != playerDetails['playerID']) { //If there is only one player and the new player id is not same as the already existing one
          game[roomID]['players'].push(playerDetails); //add the player
          socket.join(roomID);
          cb('ok');
        }
        if (game[roomID]['players'].length === 0) { // If there are no players i.e Just created and waiting for the created user to join.
          game[roomID]['players'].push(playerDetails);
          socket.join(roomID);
          cb('ok');
        }
      } else {
        game[roomID]['players'].forEach(item => {
          if (item['playerID'] == playerDetails['playerID']) {
            cb('ingame');
          }
        })
        cb('full');
      }
      console.log('joinRoom event');
      console.log(game[roomID]['players']);
    }

    const leaveRoom = (userID, roomID) => {
      console.log('exiting Room: ' + roomID);
      if (game[roomID] !== undefined) {
        let position = -99;
        for (let i = 0; i < game[roomID]['players'].length; i++) {
          if (game[roomID]['players'][i]['playerID'] == userID) {
            position = i;
            break;
          }
        }
        if (position >= 0) {
          game[roomID]['players'].splice(position, 1);
          // game[roomID]['vacent'] = true;
        }
        if (game[roomID]['players'].length == 0) {
          delete game[roomID];
        }
      }
      console.log('game Object');
      console.log(game);
    };

    // if (socket.recovered) {
    //   console.log('socket recovered');
    //   if (socket.rooms.size == 2) {
    //     const userID = socket.rooms.values().next().value;
    //     const roomID = socket.rooms.values().next().value;
    //     console.log('recovered id' + userID);
    //     if (game[roomID] != undefined) {
    //       joinRoom(roomID);
    //     }
    //   }
    // }

    socket.on('room:get', (cb) => {
      let roomFound = false;
      Object.keys(game).forEach(key => {
        if ((!game[key]['private']) && (game[key]['players'].length < 2)) {
          // if (game[key]['players'].length == 2) {
          //   game[key]['vacent'] = false;
          // }
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

    socket.on('room:join', (roomID, player_name, cb) => {
      joinRoom(roomID, player_name, cb);
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

    socket.on('send:sampleMsg', (msg, roomID) => {
      const sData = socket.rooms.values();
      const userID = sData.next().value;
      const room = sData.next().value;
      if (game[roomID] != undefined) {
        if (game[roomID]['players'].length == 2) {
          console.log(game[roomID]['players']);
          game[roomID]['players'].forEach(player => {
            if (player['playerID'] == userID) {
              player['option'] = msg;
              player['optionLock'] = true;
            }
          });
          if (game[roomID]['players'][0]['optionLock'] && game[roomID]['players'][1]['optionLock']) {
            io.to(roomID).except(game[roomID]['players'][0]['playerID']).emit('get:sampleRes', game[roomID]['players'][0]['option'], game[roomID]['players'][0]['name']);
            io.to(roomID).except(game[roomID]['players'][1]['playerID']).emit('get:sampleRes', game[roomID]['players'][1]['option'], game[roomID]['players'][1]['name']);
            game[roomID]['players'][0]['optionLock'] = false;
            game[roomID]['players'][1]['optionLock'] = false;
          }
        } else {
          io.to(userID).emit('get:sampleRes', 'Opponet has left the game');
          game[roomID]['players'][0]['optionLock'] = false;
        }
        // io.to(room).except(userID).emit('get:sampleRes', msg);
      } else {
        io.to(userID).emit('get:sampleRes', 'not in room');
      }
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