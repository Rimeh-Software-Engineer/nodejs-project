const { expressjwt: expressJwt } = require("express-jwt");

function authJwt() {
  const secret = process.env.secret;
  const api = process.env.API_URL;

  console.log(`API URL: ${api}`); // Log API URL
  console.log("Excluding paths:", [
    `${api}/users/login`,
    `${api}/users/register`,
    `${api}/comments(.*)`,
  ]); // Log excluded paths

  return expressJwt({
    secret,
    algorithms: ["HS256"],
    isRevoked: isRevoked,
  }).unless({
    path: [
      `${api}/users/login`,
      `${api}/users/register`,
      { url: /\/api\/users/, methods: ["GET", "POST", "DELETE", "PUT"] },
      { url: /\/api\/comments/, methods: ["GET", "POST", "DELETE"] },
      { url: /\/api\/categories/, methods: ["GET", "POST", "DELETE", "PUT"] },
      { url: /\/api\/products/, methods: ["GET", "POST", "DELETE", "PUT"] },
      { url: /\/api\/ratings/, methods: ["GET", "POST", "DELETE", "PUT"] },
      {
        url: /\/api\/recommendations/,
        methods: ["GET", "POST", "DELETE", "PUT"],
      },
      { url: /\/api\/products\/\w+\/rate/, methods: ["POST"] },
      { url: /\/api\/offers/, methods: ["GET", "POST", "DELETE", "PUT"] },
      { url: /\/public\/uploads(.*)/, methods: ["GET", "OPTIONS"] },
      ,
    ],
  });
}

async function isRevoked(req, payload, done) {
  done();
}

module.exports = authJwt;
