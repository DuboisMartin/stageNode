var fs = require('fs');
var cp = require('child_process');
var out = fs.openSync('./out.log', 'w');
var err = fs.openSync('./err.log', 'w');
var child = cp.spawn('node.exe', [], {
    detached: true,
    stdio: ['ignore', out, err]
});

child.on('error', console.error);

child.unref();