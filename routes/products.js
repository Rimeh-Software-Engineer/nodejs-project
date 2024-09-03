const express = require("express");
const router = express.Router();
const { Product } = require("../models/products");
const { Category } = require("../models/categories");
const { User } = require("../models/users");
const multer = require("multer");
const mongoose = require("mongoose");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");
const { fetchRatings } = require("./ratings");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("Invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

// Add a new product
router.post("/", uploadOptions.single("image"), async (req, res) => {
  try {
    const { price, previousPrice } = req.body;

    if (price >= previousPrice) {
      return res
        .status(400)
        .send("New price must be less than the previous price");
    }
    const file = req.file;
    if (!file) return res.status(400).send("No image in the request");

    const fileName = file.filename;
    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      previousPrice: req.body.previousPrice,
      description: req.body.description,
      categoryId: req.body.categoryId,
      image: `${basePath}${fileName}`,
      numberOfReviews: req.body.numberOfReviews,
      isFavorite: req.body.isFavorite,
      userId: req.body.userId,
    });

    const savedProduct = await newProduct.save();
    res.status(201).send(savedProduct);
  } catch (error) {
    console.error("Error adding product:", error);
    res.status(500).send({ message: "Error adding product", error });
  }
});

// Get all products
// Get all products with optional category filter
router.get("/", async (req, res) => {
  try {
    let filter = {};
    if (req.query.category) {
      const category = await Category.findOne({ name: req.query.category });
      if (category) {
        filter.categoryId = category._id;
      } else {
        return res.status(404).send("Category not found");
      }
    }

    const products = await Product.find(filter).populate("categoryId");
    res.status(200).send(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Error fetching products");
  }
});

// Get a product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "categoryId"
    );
    if (!product) {
      return res.status(404).send("Product not found");
    }
    const productWithCategoryName = {
      ...product.toObject(),
      categoryName: product.categoryId.name,
    };
    res.status(200).send(productWithCategoryName);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).send("Error fetching product");
  }
});

// Update a product
router.put("/:id", uploadOptions.single("image"), async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product Id");
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send("Invalid Product!");

    const { price, previousPrice } = req.body;

    if (price >= previousPrice) {
      return res
        .status(400)
        .send("New price must be less than the previous price");
    }

    // Get category ID if a category name is provided
    let categoryId = product.categoryId;
    if (req.body.categoryName) {
      const category = await Category.findOne({ name: req.body.categoryName });
      if (category) {
        categoryId = category._id;
      } else {
        return res.status(404).send("Category not found");
      }
    }

    const file = req.file;
    let imagepath = product.image;

    if (file) {
      const fileName = file.filename;
      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      imagepath = `${basePath}${fileName}`;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        price: req.body.price,
        previousPrice: req.body.previousPrice,
        description: req.body.description,
        categoryId: categoryId,
        image: imagepath,
        numberOfReviews: req.body.numberOfReviews,
        isFavorite: req.body.isFavorite,
      },
      { new: true }
    );

    if (!updatedProduct)
      return res.status(500).send("The product cannot be updated!");

    res.send(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .send({ message: "Error updating product", error: error.message });
  }
});

// Delete a product
router.delete("/:id", async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).send("Product not found");
    }

    console.log("Export Ratings Request Received");
    const ratingsData = await fetchRatings();

    console.log("Ratings Data Fetched Successfully");

    const csvWriter = createCsvWriter({
      path: path.join(__dirname, "../public/ratings_data.csv"),
      header: [
        { id: "userId", title: "userId" },
        { id: "productId", title: "productId" },
        { id: "rating", title: "rating" },
      ],
    });

    console.log(
      "Saving CSV file to:",
      path.join(__dirname, "../public/ratings_data.csv")
    );

    await csvWriter.writeRecords(ratingsData);
    res.status(200).send(deletedProduct);
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Error deleting product");
  }
});

// async function fetchRatings() {
//   try {
//     // Fetch only necessary fields and add pagination if needed
//     const products = await Product.find({}, "ratings")
//       .populate("ratings.userId", "name")
//       .exec();

//     console.log("Products:", products);

//     // Extract ratings data
//     const ratingsData = products.flatMap((product) =>
//       product.ratings.map((rating) => ({
//         userId: rating.userId._id,
//         productId: product._id,
//         rating: rating.rating,
//       }))
//     );

//     console.log("Ratings Data:", ratingsData);

//     return ratingsData;
//   } catch (error) {
//     console.error("Error fetching ratings data:", error);
//     throw new Error("Error fetching ratings data: " + error.message);
//   }
// }

router.post("/:productId/rate", async (req, res) => {
  const { productId } = req.params;
  const { userId, rating } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate rating value
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .send({ message: "Rating must be between 1 and 5" });
    }

    // Find existing rating and update or add a new one
    const existingRatingIndex = product.ratings.findIndex(
      (r) => r.userId.toString() === userId
    );

    if (existingRatingIndex !== -1) {
      // Update existing rating
      product.ratings[existingRatingIndex].rating = rating;
    } else {
      // Add new rating
      product.ratings.push({ userId, rating });
    }

    // Recalculate average rating
    product.calculateAverageRating();
    await product.save();

    console.log("Export Ratings Request Received");
    const ratingsData = await fetchRatings();

    console.log("Ratings Data Fetched Successfully");

    const csvWriter = createCsvWriter({
      path: path.join(__dirname, "../public/ratings_data.csv"),
      header: [
        { id: "userId", title: "userId" },
        { id: "productId", title: "productId" },
        { id: "rating", title: "rating" },
      ],
    });

    console.log(
      "Saving CSV file to:",
      path.join(__dirname, "../public/ratings_data.csv")
    );

    await csvWriter.writeRecords(ratingsData);

    res.status(200).json(product);
  } catch (error) {
    console.error("Error rating product:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Error rating product", error: error.message });
  }
});

router.get("/:productId/rating/:userId", async (req, res) => {
  const { productId, userId } = req.params;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const rating = product.ratings.find((r) => r.userId.toString() === userId);
    if (rating) {
      return res.status(200).json(rating);
    } else {
      console.log("ENTERING");
      return res.status(204);
    }
  } catch (error) {
    console.error("Error fetching rating:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Error fetching rating", error: error.message });
  }
});

module.exports = router;
