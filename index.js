// used https://github.com/rsp/node-static-http-servers/blob/master/http.js as my starting point

const path = require('path');
const http = require('http');
const fs = require('fs');

const dir = path.join(__dirname, 'static');

const MIME = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

const IMAGE_TYPES = [
  MIME.gif,
  MIME.jpg,
  MIME.png,
  MIME.svg
];

const server = http.createServer(function (req, res) {
    const reqpath = req.url.toString().split('?')[0];

    if (req.method !== 'GET') {
        res.statusCode = 501;
        res.setHeader('Content-Type', MIME.txt);
        return res.end('Method not implemented');
    }

    const file = path.join(dir, reqpath);

    // Confused about what case this covers. If we're formulating the file with path.join and putting dir first, wouldn't the index always be 0?
    if (file.indexOf(dir + path.sep) !== 0) {
        res.statusCode = 403;
        res.setHeader('Content-Type', MIME.txt);
        return res.end('Forbidden');
    }

    const type = MIME[path.extname(file).slice(1)] || MIME.txt;
    const stream = fs.createReadStream(file);
    stream.on('open', function () {
        res.setHeader('Content-Type', type);
        stream.pipe(res); //end() is automatically called once we've read everything from the stream
    });

    stream.on('error', function () {
        res.setHeader('Content-Type', MIME.txt);
        res.statusCode = 404;
        res.end('Not found');
    });
});

server.listen(3000, function () {
    console.log('Listening on http://localhost:3000/');
});
