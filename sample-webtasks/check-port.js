// https://nodejs.org/api/net.html
var net = require('net');

// regex pattern hack to detect web content
var httpresponse = /HTTP/g;

// regex patten hack to detect ssh server
var sshrepsonse = /SSH/ig;

module.exports = function (ctx, results) {
	// grab the host from the request
    var host = ctx.data.host;

	// grab the port from the request
    var port = ctx.data.port;

	// initize a default response
    var response = 'check port : ' + port + ' on host: ' + host;

	// initate a connection to the host on the requested port
    var socket = net.createConnection(port, host);

	// set a timeout to avoid an uncaught error for ports that aren't open
	// related to https://github.com/nodejs/node/pull/4482
    socket.setTimeout(3);

	// got data from the socket
    socket.on('data', function(data) {
		// quick check for HTTP in the data from the host
        if (httpresponse.test(data)) {
            response = 'http detected on host ' + host + ' on port ' + port;
		// quick check for SSH(case insenstive) in the data from the host
        } else if (sshrepsonse.test(data)) {
            response = 'ssh detected on host ' + host + ' on port ' + port;
        } else {
            response = 'Port ' + port + ' on host: ' + host + ' is open but no http or ssh detected';
        }
	// throw generic http get at the port
    }).on('connect', function() {
       // Manually write an HTTP request.
       socket.write("GET / HTTP/1.0\r\n\r\n");
	// socket is closed, return results to the requestor
    }).on('end', function() {
        results(null, response);
	// error opening a connection to the host. i.e. port is unavailable(closed, firewalled, etc)
    }).on('error', function() {
       results(null, 'Port ' + port + ' on Host ' + host + ' is NOT open');
    });
}

