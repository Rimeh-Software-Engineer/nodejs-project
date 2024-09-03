const express = require("express");
const router = express.Router();
const { Product } = require("../models/products");
const multer = require("multer");
const mongoose = require("mongoose");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const path = require("path");

// Fetch ratings data
async function fetchRatings() {
  try {
    // Fetch only necessary fields and add pagination if needed
    const products = await Product.find({}, "ratings")
      .populate("ratings.userId", "name")
      .exec();

    console.log("Products:", products);

    // Extract ratings data
    const ratingsData = products.flatMap((product) =>
      product.ratings.map((rating) => ({
        userId: rating.userId._id,
        productId: product._id,
        rating: rating.rating,
      }))
    );

    console.log("Ratings Data:", ratingsData);

    return ratingsData;
  } catch (error) {
    console.error("Error fetching ratings data:", error);
    throw new Error("Error fetching ratings data: " + error.message);
  }
}

// Export ratings data to CSV
router.get("/export-ratings", async (req, res) => {
  try {
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
    res.status(200).send("Ratings data exported to CSV successfully!");
  } catch (error) {
    console.error("Error exporting ratings data to CSV:", error);
    res
      .status(500)
      .send("Error exporting ratings data to CSV: " + error.message);
  }
});

module.exports = { router, fetchRatings };
