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

const ERROR_RESPONSES = {
  403: 'Forbidden',
  404: 'Not found',
  500: 'Internal server error',
  501: 'Method not implemented'
};

module.exports = {
  MIME,
  ERROR_RESPONSES
};
