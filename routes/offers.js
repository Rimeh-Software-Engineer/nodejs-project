// routes/offers.js
const express = require("express");
const router = express.Router();
const { Offer } = require("../models/offers");
const { Product } = require("../models/products");
const { User } = require("../models/users");

// Create a new offer
router.post("/", async (req, res) => {
  try {
    // Validate productId
    const product = await Product.findById(req.body.productId);
    if (!product) return res.status(404).send("Product not found");
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).send("User not found");

    const offer = new Offer({
      title: req.body.title,
      description: req.body.description,
      discount: req.body.discount,
      productId: req.body.productId,
      userId: req.body.userId,
      expiredDate: req.body.expiredDate,
    });
    const savedOffer = await offer.save();
    res.status(201).send(savedOffer);
  } catch (error) {
    res.status(500).send({ message: "Error creating offer", error });
  }
});

// Get all offers
router.get("/", async (req, res) => {
  try {
    const offers = await Offer.find({ is_active: true });
    res.status(200).send(offers);
  } catch (error) {
    res.status(500).send({ message: "Error fetching offers", error });
  }
});

// Get a single offer by ID
router.get("/:id", async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) {
      return res.status(404).send("Offer not found");
    }
    res.status(200).send(offer);
  } catch (error) {
    res.status(500).send({ message: "Error fetching offer", error });
  }
});

// Update an offer
router.put("/:id", async (req, res) => {
  try {
    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        discount: req.body.discount,
      },
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(404).send("Offer not found");
    }
    res.status(200).send(updatedOffer);
  } catch (error) {
    res.status(500).send({ message: "Error updating offer", error });
  }
});

// Delete an offer
router.delete("/:id", async (req, res) => {
  try {
    const deletedOffer = await Offer.findByIdAndDelete(req.params.id);
    if (!deletedOffer) {
      return res.status(404).send("Offer not found");
    }
    res.status(200).send({ message: "Offer deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: "Error deleting offer", error });
  }
});

module.exports = router;
