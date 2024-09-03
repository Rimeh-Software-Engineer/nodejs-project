const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  previousPrice: {
    type: Number,
  },
  description: {
    type: String,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
  images: [
    {
      type: String,
    },
  ],
  ratings: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: { type: Number, required: true },
    },
  ],
  review_scores_rating: {
    type: Number,
    default: 0,
  },
  numberOfReviews: {
    type: Number,
    default: 0,
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User schema
    required: true,
  },
});

productSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

productSchema.set("toJSON", {
  virtuals: true,
});

productSchema.methods.calculateAverageRating = function () {
  const latestRatings = {};

  // Iterate over all ratings and keep only the latest rating per user
  this.ratings.forEach((rating) => {
    latestRatings[rating.userId] = rating.rating;
  });

  // Convert the latestRatings object to an array of ratings
  const ratingsArray = Object.values(latestRatings);
  const total = ratingsArray.reduce((acc, rating) => acc + rating, 0);
  this.review_scores_rating =
    ratingsArray.length > 0 ? total / ratingsArray.length : 0;
};

exports.Product = mongoose.model("Product", productSchema);
exports.productSchema = productSchema;
