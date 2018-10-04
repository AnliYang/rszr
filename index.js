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

const ERROR_RESPONSES = {
  400: 'Bad request',
  403: 'Forbidden',
  404: 'Not found',
  500: 'Internal server error',
  501: 'Method not implemented'
};

const sendErrorResponse = (res, code) => {
  res.setHeader('Content-Type', MIME.txt);
  res.statusCode = code;
  res.end(ERROR_RESPONSES[code]);
};

const getResizeParams = (reqPath) => {
  const { dir, base: resizedNameWithExt, name, ext } = path.parse(reqPath);
  const invalid = { valid: false }

  if (!dir.endsWith('/resized')) {
    return invalid;
  }

  try {
    const nameParts = name.split('_');
    const rawName = nameParts.slice(0, nameParts.length - 1).join();
    let [ width, height ] = nameParts[nameParts.length - 1].split('x');
    width = Number(width);
    height = Number(height);

    if (!width || !height) {
      return invalid;
    }

    return {
      valid: true,
      resizedNameWithExt,
      rawName,
      ext,
      width: Number(width),
      height: Number(height)
    };
  } catch(err) {
    return invalid;
  }
};

const server = http.createServer((req, res) => {
  const reqPath = req.url.toString().split('?')[0];

  if (req.method !== 'GET') {
    sendErrorResponse(res, 501)
  }

  const file = path.join(dir, reqPath);

  // Confused about what case this covers. If we're formulating the file with path.join and putting dir first, wouldn't the index always be 0?
  if (file.indexOf(dir + path.sep) !== 0) {
    sendErrorResponse(res, 403);
  }

  const type = MIME[path.extname(file).slice(1)] || MIME.txt;

  const stream = fs.createReadStream(file);

  // we have the image, raw or resized
  stream.on('open', () => {
    console.log('We have this file! Serving it up!')
    res.setHeader('Content-Type', type);
    stream.pipe(res); //end() is automatically called once we've read everything from the stream
  });

  // we don't have the image already, but we may have the raw version if they're asking for resized
  stream.on('error', () => {
    const { valid, resizedNameWithExt, rawName, ext, width, height } = getResizeParams(reqPath);

    if (!valid) {
      return sendErrorResponse(res, 400);
    }

    const rawFilePath = `static/raw/${rawName}${ext}`
    const resizedFilePath = `static/resized/${resizedNameWithExt}`;
    sharp(rawFilePath)
      .resize(width,height)
      .toFile(resizedFilePath, (err, info) => {
        if (err) {
          console.error(err);
          return sendErrorResponse(res, 404);
        }

        const stream = fs.createReadStream(resizedFilePath);

        stream.on('open', () => {
          res.setHeader('Content-Type', type);
          stream.pipe(res);
        });

        // if for some reason we can't find the file we just created
        stream.on('error', () => {
          sendErrorResponse(res, 500)
        });
      });
  });
});

server.listen(3000, () => {
  console.log('Listening on http://localhost:3000/');
});
