const storage = require("./persistent-storage");
const { normalizeNickname } = require("./save-validation");
const { usernameKey } = require("./auth");
const { listOnlinePlayers } = require("./presence");

let friendsStore = {};

function emptyRecord() {
  return { friends: [], incoming: [], outgoing: [] };
}

function saveFriendsStore() {
  storage.writeJson("friends", friendsStore);
}

async function loadFriendsStore() {
  friendsStore = (await storage.readJson("friends", {})) || {};
}

function getRecord(key) {
  if (!friendsStore[key]) {
    friendsStore[key] = emptyRecord();
  }
  return friendsStore[key];
}

function findFriend(list, targetKey) {
  return list.findIndex((entry) => entry.usernameKey === targetKey);
}

function removeRequestLists(record, targetKey) {
  record.incoming = record.incoming.filter((entry) => entry.usernameKey !== targetKey);
  record.outgoing = record.outgoing.filter((entry) => entry.usernameKey !== targetKey);
}

function addFriendPair(fromKey, fromName, toKey, toName) {
  const fromRec = getRecord(fromKey);
  const toRec = getRecord(toKey);
  const now = Date.now();

  removeRequestLists(fromRec, toKey);
  removeRequestLists(toRec, fromKey);

  if (findFriend(fromRec.friends, toKey) < 0) {
    fromRec.friends.push({ usernameKey: toKey, username: toName, since: now });
  }
  if (findFriend(toRec.friends, fromKey) < 0) {
    toRec.friends.push({ usernameKey: fromKey, username: fromName, since: now });
  }

  fromRec.friends.sort((a, b) => a.username.localeCompare(b.username, "sv"));
  toRec.friends.sort((a, b) => a.username.localeCompare(b.username, "sv"));
}

function resolveAccount(getAccountByUsername, username) {
  const displayName = normalizeNickname(username);
  const nickError = require("./save-validation").validateNickname(displayName);
  if (nickError) return { ok: false, error: nickError };
  const account = getAccountByUsername(displayName);
  if (!account) return { ok: false, error: "Player not found." };
  return { ok: true, account };
}

function sendFriendRequest(fromDisplayName, targetUsername, getAccountByUsername) {
  const fromKey = usernameKey(fromDisplayName);
  const target = resolveAccount(getAccountByUsername, targetUsername);
  if (!target.ok) return target;

  const toKey = target.account.usernameKey;
  const toName = target.account.displayName;

  if (fromKey === toKey) {
    return { ok: false, error: "You cannot add yourself." };
  }

  const fromRec = getRecord(fromKey);
  const toRec = getRecord(toKey);

  if (findFriend(fromRec.friends, toKey) >= 0) {
    return { ok: false, error: "You are already friends." };
  }

  if (findFriend(fromRec.incoming, toKey) >= 0) {
    addFriendPair(fromKey, fromDisplayName, toKey, toName);
    saveFriendsStore();
    return { ok: true, autoAccepted: true, message: "Friend added." };
  }

  if (findFriend(fromRec.outgoing, toKey) >= 0) {
    return { ok: false, error: "Friend request already sent." };
  }

  const now = Date.now();
  fromRec.outgoing.push({ usernameKey: toKey, username: toName, createdAt: now });
  toRec.incoming.push({ usernameKey: fromKey, username: fromDisplayName, createdAt: now });
  saveFriendsStore();
  return { ok: true, message: "Friend request sent." };
}

function acceptFriendRequest(accepterDisplayName, requesterUsername, getAccountByUsername) {
  const accepterKey = usernameKey(accepterDisplayName);
  const requester = resolveAccount(getAccountByUsername, requesterUsername);
  if (!requester.ok) return requester;

  const requesterKey = requester.account.usernameKey;
  const requesterName = requester.account.displayName;
  const accepterRec = getRecord(accepterKey);

  if (findFriend(accepterRec.incoming, requesterKey) < 0) {
    return { ok: false, error: "No friend request from this player." };
  }

  addFriendPair(accepterKey, accepterDisplayName, requesterKey, requesterName);
  saveFriendsStore();
  return { ok: true, message: "Friend added." };
}

function declineFriendRequest(accepterDisplayName, requesterUsername, getAccountByUsername) {
  const accepterKey = usernameKey(accepterDisplayName);
  const requester = resolveAccount(getAccountByUsername, requesterUsername);
  if (!requester.ok) return requester;

  const requesterKey = requester.account.usernameKey;
  const accepterRec = getRecord(accepterKey);
  const requesterRec = getRecord(requesterKey);

  if (findFriend(accepterRec.incoming, requesterKey) < 0) {
    return { ok: false, error: "No friend request from this player." };
  }

  removeRequestLists(accepterRec, requesterKey);
  removeRequestLists(requesterRec, accepterKey);
  saveFriendsStore();
  return { ok: true, message: "Request declined." };
}

function cancelFriendRequest(senderDisplayName, targetUsername, getAccountByUsername) {
  const senderKey = usernameKey(senderDisplayName);
  const target = resolveAccount(getAccountByUsername, targetUsername);
  if (!target.ok) return target;

  const targetKey = target.account.usernameKey;
  const senderRec = getRecord(senderKey);
  const targetRec = getRecord(targetKey);

  if (findFriend(senderRec.outgoing, targetKey) < 0) {
    return { ok: false, error: "No pending request to this player." };
  }

  removeRequestLists(senderRec, targetKey);
  removeRequestLists(targetRec, senderKey);
  saveFriendsStore();
  return { ok: true, message: "Request cancelled." };
}

function removeFriend(userDisplayName, friendUsername, getAccountByUsername) {
  const userKey = usernameKey(userDisplayName);
  const friend = resolveAccount(getAccountByUsername, friendUsername);
  if (!friend.ok) return friend;

  const friendKey = friend.account.usernameKey;
  const userRec = getRecord(userKey);
  const friendRec = getRecord(friendKey);

  if (findFriend(userRec.friends, friendKey) < 0) {
    return { ok: false, error: "This player is not on your friends list." };
  }

  userRec.friends = userRec.friends.filter((entry) => entry.usernameKey !== friendKey);
  friendRec.friends = friendRec.friends.filter((entry) => entry.usernameKey !== userKey);
  saveFriendsStore();
  return { ok: true, message: "Friend removed." };
}

function getOnlineMap() {
  const map = new Map();
  for (const player of listOnlinePlayers()) {
    map.set(player.usernameKey, player);
  }
  return map;
}

function enrichFriend(entry) {
  const onlineMap = getOnlineMap();
  const online = onlineMap.get(entry.usernameKey);
  return {
    username: entry.username,
    usernameKey: entry.usernameKey,
    since: entry.createdAt || entry.since || 0,
    online: Boolean(online),
    status: online ? online.status || "online" : "offline",
    inGame: Boolean(online?.inGame),
    wave: Number(online?.wave || 0)
  };
}

function areFriends(displayName, otherUsername) {
  const userKey = usernameKey(displayName);
  const otherKey = usernameKey(normalizeNickname(otherUsername));
  if (!userKey || !otherKey) return false;
  const record = getRecord(userKey);
  return findFriend(record.friends, otherKey) >= 0;
}

function getFriendsSnapshot(displayName) {
  const key = usernameKey(displayName);
  const record = getRecord(key);

  return {
    friends: record.friends.map(enrichFriend),
    incoming: record.incoming.map((entry) => ({
      username: entry.username,
      usernameKey: entry.usernameKey,
      createdAt: entry.createdAt || 0
    })),
    outgoing: record.outgoing.map((entry) => ({
      username: entry.username,
      usernameKey: entry.usernameKey,
      createdAt: entry.createdAt || 0
    })),
    incomingCount: record.incoming.length,
    friendCount: record.friends.length
  };
}

module.exports = {
  acceptFriendRequest,
  areFriends,
  cancelFriendRequest,
  declineFriendRequest,
  getFriendsSnapshot,
  loadFriendsStore,
  removeFriend,
  sendFriendRequest
};
