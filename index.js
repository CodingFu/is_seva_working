var Hapi = require('hapi');
var fs = require('fs');
var request = require('request');
var moment = require('moment');
var config = JSON.parse(fs.readFileSync(__dirname + "/settings.json"));
var server = Hapi.createServer('0.0.0.0', config.port);

// TOGGL API THING
var status = {
  description: "nothing",
  is_working: false,
  last_seen: new Date()
};

function getStatus() {
  request.get('https://www.toggl.com/api/v8/time_entries/current', {
    auth: {
      user: config.api_token,
      password: 'api_token',
      json: true
    }
  }, statusHandler);
}

function statusHandler(error, response) {
  if (error) {
    console.log("API ERROR");
    return;
  }

  try {
    var data = JSON.parse(response.body).data;
  } catch(e) {
    var data = null;
  }

  if (data) {
    status.is_working = true;
    status.last_seen = new Date();
    status.description = data.description;
  } else {
    status.is_working = false;
    status.last_seen_humanized = moment(status.last_seen).fromNow();
  }
}

setInterval(getStatus, 10000);

// ROUTES
server.route({
  path: '/',
  method: 'GET',
  handler: {
    file: __dirname + '/public/index.html'
  }
});

server.route({
  path: '/status.json',
  method: 'GET',
  handler: function(req, reply) {
    reply(status);
  }
});

server.start();
