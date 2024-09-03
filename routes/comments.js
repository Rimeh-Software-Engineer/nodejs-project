const { Comment } = require("../models/comments");
const express = require("express");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    console.log("Request body:", req.body); // Ajout de log pour afficher le corps de la requête

    const newComment = new Comment({
      listingId: req.body.listingId,
      name: req.body.name,
      comment: req.body.comment,
      pictureUrl: req.body.pictureUrl,
    });

    const savedComment = await newComment.save();
    console.log("Comment saved:", savedComment); // Ajout de log pour afficher le commentaire enregistré

    res.status(201).send(savedComment);
  } catch (error) {
    console.error("Error adding comment:", error); // Ajout de log pour afficher l'erreur
    res.status(500).send({ message: "Error adding comment", error });
  }
});

router.get("/:id", async (req, res) => {
  console.log("GET /api/comments/:id called");
  console.log("Listing ID:", req.params.id);
  console.log("User info:", req.user); // Check the user info from the token

  try {
    const comments = await Comment.find({ listingId: req.params.id });
    res.status(200).send(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).send("Error fetching comments");
  }
});

// New route to fetch all comments
router.get("/", async (req, res) => {
  console.log("GET /api/comments called");

  try {
    const comments = await Comment.find();
    res.status(200).send(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).send("Error fetching comments");
  }
});

// Delete a comment by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedComment = await Comment.findByIdAndDelete(req.params.id);
    if (!deletedComment) {
      return res.status(404).send({ message: "Comment not found" });
    }
    res.status(200).send({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).send({ message: "Error deleting comment", error });
  }
});

module.exports = router;
