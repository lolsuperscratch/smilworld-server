const WebSocket = require('ws');
const wss = new WebSocket.Server({port:8080}) // you can edit the port if you want to have a different port.
function broadcast(from,data) {
  wss.clients.forEach(function each(client) {
      if (client !== from && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
  });
}
function serverbroadcast(data) {
  wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
  });
}
var blocks = {};
wss.on('connection', function connection(ws) {
  ws.username = "player"
  ws.userId = Math.floor(Math.random()*99999999) // generate user id by number.
  broadcast(ws,'join|'+ws.userId) // greetings
  wss.clients.forEach(function each(client) {
      // send join messages that are connected into this server
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        ws.send('join|'+client.userId)
      }
  });
  // get a blocks list and send it to this client.
  for (var i in blocks) {
    ws.send('block|'+blocks[i].id+"|"+blocks[i].x+"|"+blocks[i].y+"|"+blocks[i].type)
  }
  ws.on('message',function incoming(data) {
    var parsed = data.split('|')
    if (parsed[0] == "username") {
      // make the username changed.
      ws.username = parsed[1]
    }
    if (parsed[0] == "update") {
      // update client positions and avatar
      broadcast(ws,"update|"+ws.userId+"|"+ws.username+"|"+parsed[1]+"|"+parsed[2]+"|"+parsed[3]+"|"+parsed[4]+"|"+parsed[5])
    }
    if (parsed[0] == "chat") {
      // send a chat message from this client.
      serverbroadcast("chat|"+ws.username+"|"+parsed[1])
    }
    if (parsed[0] == "create") {
      // create a new block.
      var generatedid = Math.floor(Math.random()*99999999)
      blocks[generatedid] = {id:generatedid,x:parsed[1],y:parsed[2],type:parsed[3]}
      serverbroadcast("block|"+generatedid+"|"+parsed[1]+"|"+parsed[2]+"|"+parsed[3])
    }
    if (parsed[0] == "destroy") {
      // destroy a block
      delete blocks[parsed[1]]
      serverbroadcast("destroy|"+parsed[1])
    }
  })
  ws.on('close',function () {
    // player left the server.
    serverbroadcast("left|"+ws.userId)
  })
})
