// used https://github.com/rsp/node-static-http-servers/blob/master/http.js as my starting point

const path = require('path');
const http = require('http');
const fs = require('fs');
const sharp = require('sharp');

const CONSTANTS = require('./constants');

const dir = path.join(__dirname, 'static');

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

const sendErrorResponse = (res, code) => {
  res.setHeader('Content-Type', CONSTANTS.MIME.txt);
  res.statusCode = code;
  res.end(CONSTANTS.ERROR_RESPONSES[code]);
};

const handleStream = (stream, onOpen, onError) => {
  stream.on('open', onOpen);
  stream.on('error', onError);
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

  const type = CONSTANTS.MIME[path.extname(file).slice(1)] || CONSTANTS.MIME.txt;

  const rawStream = fs.createReadStream(file);
  handleStream(rawStream, () => {
    // we have the image, raw or resized
    console.log('We have this file! Serving it up!')
    res.setHeader('Content-Type', type);
    rawStream.pipe(res); //end() is automatically called once we've read everything from the stream
  }, () => {
    // we don't have the image already, but we may have the raw version if they're asking for resized
    const { valid, resizedNameWithExt, rawName, ext, width, height } = getResizeParams(reqPath);

    if (!valid) {
      return sendErrorResponse(res, 404);
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

        const resizedStream = fs.createReadStream(resizedFilePath);
        handleStream(resizedStream, () => {
          console.log('Serving up the newly resized image!')
          res.setHeader('Content-Type', type);
          resizedStream.pipe(res);
        }, () => {
          sendErrorResponse(res, 500);
        });
      });
  });
});

server.listen(3000, () => {
  console.log('Listening on http://localhost:3000/');
});
