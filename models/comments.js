const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  pictureUrl: {
    type: String,
    required: true,
  },
});

commentSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

commentSchema.set("toJSON", {
  virtuals: true,
});

exports.Comment = mongoose.model("Comment", commentSchema);
