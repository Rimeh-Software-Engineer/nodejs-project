const express = require("express");
const router = express.Router();
const { Category } = require("../models/categories");
const { Product } = require("../models/products");

// Route for counting products in each category
router.get("/counts", async (req, res) => {
  try {
    // Fetch all categories
    const categories = await Category.find();

    // Count products for each category
    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({
          categoryId: category._id,
        });
        return {
          categoryId: category._id,
          categoryName: category.name,
          productCount,
        };
      })
    );

    res.status(200).send(categoryCounts);
  } catch (error) {
    console.error("Error fetching product counts per category:", error);
    res
      .status(500)
      .send({ message: "Error fetching product counts per category", error });
  }
});

router.post("/", async (req, res) => {
  try {
    const newCategory = new Category({
      name: req.body.name,
    });

    const savedCategory = await newCategory.save();
    res.status(201).send(savedCategory);
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).send({ message: "Error adding category", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).send(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error fetching categories");
  }
});

// Get a single category by ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).send("Category not found");
    res.status(200).send(category);
  } catch (error) {
    res.status(500).send({ message: "Error fetching category", error });
  }
});

// Update a category by ID
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!category) return res.status(404).send("Category not found");
    res.status(200).send(category);
  } catch (error) {
    res.status(500).send({ message: "Error updating category", error });
  }
});

// Delete a category by ID
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).send("Category not found");
    res.status(200).send({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting category", error });
  }
});

module.exports = router;
