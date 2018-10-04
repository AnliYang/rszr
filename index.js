// used https://github.com/rsp/node-static-http-servers/blob/master/http.js as my starting point

const path = require('path');
const http = require('http');
const fs = require('fs');
const sharp = require('sharp');

const dir = path.join(__dirname, 'static');

const MIME = {
  html: 'text/html',
  txt: 'text/plain',
  css: 'text/css',
  gif: 'image/gif',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  js: 'application/javascript',
  ico: 'image/x-icon'
};

const IMAGE_TYPES = [
  MIME.gif,
  MIME.jpg,
  MIME.png,
  MIME.svg
];

const send404 = (res) => {
  res.setHeader('Content-Type', MIME.txt);
  res.statusCode = 404;
  res.end('Not found');
};

const getDimensions = (name) => {
  const nameParts = name.split('_');
  let [ width, height ] = nameParts[nameParts.length - 1].split('x');

  return {
    width: Number(width),
    height: Number(height)
  };
}

const getResizeParams = (reqPath) => {
  const { dir, base: resizedNameWithExt, name, ext } = path.parse(reqPath);

  if (!dir.endsWith('/resized')) {
    return { valid: false };
  }

  const nameParts = name.split('_');
  const rawName = nameParts.slice(0, nameParts.length - 1).join();
  let [ width, height ] = nameParts[nameParts.length - 1].split('x');

  // FIXME: wrap the whole parsing thing in a try catch to just return invalid if anything hiccups
  return {
    valid: true,
    resizedNameWithExt,
    rawName,
    ext,
    width: Number(width),
    height: Number(height)
  };
};

const server = http.createServer(function (req, res) {
  const reqPath = req.url.toString().split('?')[0];

  if (req.method !== 'GET') {
    res.statusCode = 501;
    res.setHeader('Content-Type', MIME.txt);
    return res.end('Method not implemented');
  }

  const file = path.join(dir, reqPath);

  // Confused about what case this covers. If we're formulating the file with path.join and putting dir first, wouldn't the index always be 0?
  if (file.indexOf(dir + path.sep) !== 0) {
    res.statusCode = 403;
    res.setHeader('Content-Type', MIME.txt);
    return res.end('Forbidden');
  }

  const type = MIME[path.extname(file).slice(1)] || MIME.txt;

  const stream = fs.createReadStream(file);

  // we have the image, raw or resized
  stream.on('open', function () {
    console.log('We have this file! Serving it up!')
    res.setHeader('Content-Type', type);
    stream.pipe(res); //end() is automatically called once we've read everything from the stream
  });

  // we don't have the image already, but we may have the raw version if they're asking for resized
  stream.on('error', function () {
    const { valid, resizedNameWithExt, rawName, ext, width, height } = getResizeParams(reqPath);

    if (!valid) {
      return send404(res);
    }

    const rawFilePath = `static/raw/${rawName}${ext}`
    const resizedFilePath = `static/resized/${resizedNameWithExt}`;
    sharp(rawFilePath)
      .resize(width,height)
      .toFile(resizedFilePath, (err, info) => {
        if (err) {
          console.log('err: ', err);
          return send404(res);
        }

        console.log('oh hi info: ', info);
        const stream = fs.createReadStream(resizedFilePath);

        stream.on('open', function () {
          res.setHeader('Content-Type', type);
          stream.pipe(res);
        });

        // just in case we can't find the file we just created
        stream.on('error', () => {
          res.setHeader('Content-Type', MIME.txt);
          res.statusCode = 500;
          res.end('Not found');
        });
      });
  });
});

server.listen(3000, function () {
  console.log('Listening on http://localhost:3000/');
});
