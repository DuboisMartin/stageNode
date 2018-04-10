var request = require('request');

var options = {
  uri: 'http://localhost:3000/temp?temp=860',
  method: 'POST'
};

request(options, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body)
  }
});