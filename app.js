const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

// Configure CORS
const corsOptions = {
  origin: "http://localhost:5173", // Your frontend URL
  credentials: true, // Allow credentials (cookies, headers, etc.)
};
app.use(cors(corsOptions));
//app.use(cors());
//app.options("*", cors());

//middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);

//Routes
const usersRoutes = require("./routes/users");
const commentsRoutes = require("./routes/comments");
const categoriesRoutes = require("./routes/categories");
const productsRoutes = require("./routes/products");
const offersRoutes = require("./routes/offers");
const ratingsRoutes = require("./routes/ratings");
const recommendationsRoutes = require("./routes/recommendations");

api = process.env.API_URL;
app.use(api + "/users", usersRoutes);
app.use(api + "/comments", commentsRoutes);
app.use(api + "/categories", categoriesRoutes);
app.use(api + "/products", productsRoutes);
app.use(api + "/offers", offersRoutes);
app.use(api + "/ratings", ratingsRoutes.router);
app.use(api + "/recommendations", recommendationsRoutes);
mongoose
  .connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log("connected successfully");
  })
  .catch((err) => {
    console.log(err);
  });
app.listen(3000, () => {
  console.log("server is running");
});
