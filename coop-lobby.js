const { WebSocketServer } = require("ws");
const crypto = require("crypto");

const MAX_PLAYERS = 4;
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const COUNTDOWN_SECONDS = 3;

const rooms = new Map();
const socketRoom = new Map();

function send(ws, payload) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(payload));
}

function generateRoomCode() {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += ROOM_CODE_CHARS[crypto.randomInt(0, ROOM_CODE_CHARS.length)];
  }
  if (rooms.has(code)) return generateRoomCode();
  return code;
}

function getOccupiedPlayers(room) {
  return room.players.filter(Boolean);
}

function serializeRoom(room) {
  const occupied = getOccupiedPlayers(room);
  const allReady = occupied.length > 0 && occupied.every((player) => player.ready);

  return {
    code: room.code,
    hostUsername: room.hostUsername,
    status: room.status,
    countdown: room.countdown || 0,
    maxPlayers: MAX_PLAYERS,
    playerCount: occupied.length,
    allReady,
    players: room.players.map((player) =>
      player
        ? {
            username: player.username,
            ready: player.ready,
            level: player.level,
            isHost: player.username === room.hostUsername
          }
        : null
    )
  };
}

function broadcastRoom(room) {
  const payload = { type: "lobby_state", room: serializeRoom(room) };
  for (const player of getOccupiedPlayers(room)) {
    send(player.ws, payload);
  }
}

function clearRoomTimer(room) {
  if (room.countdownTimer) {
    clearInterval(room.countdownTimer);
    room.countdownTimer = null;
  }
}

function removeRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  clearRoomTimer(room);
  rooms.delete(code);
}

function leaveRoom(ws) {
  const code = socketRoom.get(ws);
  if (!code) return;

  const room = rooms.get(code);
  socketRoom.delete(ws);

  if (!room) return;

  const index = room.players.findIndex((player) => player && player.ws === ws);
  if (index >= 0) room.players[index] = null;

  clearRoomTimer(room);
  room.status = "waiting";
  room.countdown = 0;

  const occupied = getOccupiedPlayers(room);
  if (!occupied.length) {
    removeRoom(code);
    return;
  }

  if (room.hostUsername === ws.user?.username) {
    room.hostUsername = occupied[0].username;
  }

  broadcastRoom(room);
}

function findPlayerSlot(room) {
  return room.players.findIndex((player) => !player);
}

function cancelCountdown(room) {
  if (room.status !== "countdown") return;
  clearRoomTimer(room);
  room.status = "waiting";
  room.countdown = 0;
}

function tryStartCountdown(room) {
  const occupied = getOccupiedPlayers(room);
  if (room.status !== "waiting") return;
  if (!occupied.length) return;
  if (!occupied.every((player) => player.ready)) return;

  room.status = "countdown";
  room.countdown = COUNTDOWN_SECONDS;
  broadcastRoom(room);

  room.countdownTimer = setInterval(() => {
    room.countdown -= 1;
    if (room.countdown > 0) {
      broadcastRoom(room);
      return;
    }

    clearRoomTimer(room);
    room.status = "starting";
    broadcastRoom(room);

    const startPayload = {
      type: "coop_match_start",
      room: serializeRoom(room)
    };

    for (const player of getOccupiedPlayers(room)) {
      send(player.ws, startPayload);
    }
  }, 1000);
}

function createRoom(ws, helpers) {
  leaveRoom(ws);

  const profile = helpers.getPlayerLobbyProfile(ws.user.username);
  const code = generateRoomCode();
  const room = {
    code,
    hostUsername: ws.user.username,
    status: "waiting",
    countdown: 0,
    countdownTimer: null,
    players: new Array(MAX_PLAYERS).fill(null)
  };

  room.players[0] = {
    ws,
    username: ws.user.username,
    ready: false,
    level: profile.level
  };

  rooms.set(code, room);
  socketRoom.set(ws, code);
  send(ws, { type: "lobby_joined", room: serializeRoom(room) });
  broadcastRoom(room);
}

function joinRoom(ws, code, helpers) {
  const normalized = String(code || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  if (normalized.length !== 6) {
    send(ws, { type: "lobby_error", error: "Enter a valid 6-character room code." });
    return;
  }

  const room = rooms.get(normalized);
  if (!room) {
    send(ws, { type: "lobby_error", error: "Room not found." });
    return;
  }
  if (room.status !== "waiting") {
    send(ws, { type: "lobby_error", error: "That room is already starting." });
    return;
  }

  leaveRoom(ws);

  const existingIndex = room.players.findIndex(
    (player) => player && player.username.toLowerCase() === ws.user.username.toLowerCase()
  );
  let slot = existingIndex;

  if (slot < 0) {
    slot = findPlayerSlot(room);
    if (slot < 0) {
      send(ws, { type: "lobby_error", error: "Room is full (max 4 players)." });
      return;
    }
  }

  const profile = helpers.getPlayerLobbyProfile(ws.user.username);
  room.players[slot] = {
    ws,
    username: ws.user.username,
    ready: false,
    level: profile.level
  };

  socketRoom.set(ws, normalized);
  send(ws, { type: "lobby_joined", room: serializeRoom(room) });
  broadcastRoom(room);
}

function setReady(ws, ready) {
  const code = socketRoom.get(ws);
  if (!code) {
    send(ws, { type: "lobby_error", error: "You are not in a lobby." });
    return;
  }

  const room = rooms.get(code);
  if (!room) return;

  const player = getOccupiedPlayers(room).find((entry) => entry.ws === ws);
  if (!player) return;

  if (room.status === "starting") return;

  player.ready = ready === true;
  cancelCountdown(room);
  broadcastRoom(room);
  tryStartCountdown(room);
}

function handleMessage(ws, message, helpers) {
  switch (message?.type) {
    case "lobby_create":
      createRoom(ws, helpers);
      break;
    case "lobby_join":
      joinRoom(ws, message.code, helpers);
      break;
    case "lobby_leave":
      leaveRoom(ws);
      send(ws, { type: "lobby_left" });
      break;
    case "lobby_ready":
      setReady(ws, message.ready === true);
      break;
    default:
      send(ws, { type: "lobby_error", error: "Unknown lobby action." });
  }
}

function attachCoopLobbyWebSocket(server, helpers) {
  const wss = new WebSocketServer({ server, path: "/ws/coop" });

  wss.on("connection", (ws, req) => {
    const requestUrl = new URL(req.url || "/ws/coop", "http://localhost");
    const token = requestUrl.searchParams.get("token") || "";
    const session = helpers.verifySession(token);

    if (!session) {
      ws.close(4401, "Unauthorized");
      return;
    }

    ws.user = { username: session.displayName, usernameKey: session.usernameKey };
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", (raw) => {
      try {
        const message = JSON.parse(String(raw));
        handleMessage(ws, message, helpers);
      } catch (error) {
        send(ws, { type: "lobby_error", error: "Invalid lobby message." });
      }
    });

    ws.on("close", () => {
      leaveRoom(ws);
    });

    send(ws, { type: "hello", username: ws.user.username });
  });

  const heartbeat = setInterval(() => {
    for (const ws of wss.clients) {
      if (!ws.isAlive) {
        ws.terminate();
        continue;
      }
      ws.isAlive = false;
      ws.ping();
    }
  }, 30000);

  wss.on("close", () => {
    clearInterval(heartbeat);
  });

  return wss;
}

module.exports = {
  MAX_PLAYERS,
  attachCoopLobbyWebSocket
};
