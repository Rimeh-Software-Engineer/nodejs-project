const { User } = require("../models/users");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv/config");

// Fetch all users
router.get(`/`, async (req, res) => {
  try {
    const userList = await User.find().select("-passwordHash");
    if (userList.length === 0) {
      return res.status(404).json({ message: "No users found." });
    }
    res.status(200).send(userList);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// Fetch a user by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");
    if (!user) {
      return res
        .status(404)
        .json({ message: "The user with the given ID was not found." });
    }
    res.status(200).send(user);
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

/*router.post("/register", async (req, res) => {
  const existingUser = await User.findOne({ email: req.body.email });
  if (existingUser) {
    return res.status(400).send("Email already exists.");
  }
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    role: req.body.role,
  });

  if (!["customer", "merchant"].includes(req.body.role)) {
    return res.status(400).send("Invalid role specified.");
  }
  user = await user.save();

  if (!user) return res.status(400).send("the user cannot be created!");

  res.send(user);
});
*/
// Assuming ADMIN_EMAIL and ADMIN_PASSWORD are set in your environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const secret = process.env.secret;

  // Static admin login check
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign(
      {
        userId: "admin",
        role: "admin",
      },
      secret,
      { expiresIn: "1d" }
    );

    return res.status(200).send({
      user: { id: "admin", email: ADMIN_EMAIL, role: "admin" },
      token: token,
    });
  }

  // Dynamic user login check
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send("The user not found");
  }

  if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      secret,
      { expiresIn: "1d" }
    );

    res.status(200).send({
      user: { id: user.id, email: user.email, role: user.role },
      token: token,
    });
  } else {
    res.status(400).send("Password is wrong!");
  }
});

router.post("/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).send("Email already exists.");
    }

    let user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      role: req.body.role,
    });

    if (!["customer", "merchant"].includes(req.body.role)) {
      return res.status(400).send("Invalid role specified.");
    }

    user = await user.save();

    if (!user) return res.status(400).send("The user cannot be created!");

    // Generate token
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.secret, // Make sure this environment variable is set
      { expiresIn: "1d" }
    );

    // Respond with user details and token
    res.status(200).send({
      user: { id: user.id, email: user.email, role: user.role },
      token: token,
    });
  } catch (error) {
    console.error("Error during registration:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// Update a user
router.put("/:id", async (req, res) => {
  try {
    console.log("Update request received:", req.body);

    const userExist = await User.findById(req.params.id);
    if (!userExist) {
      return res.status(404).send("User not found.");
    }

    let newPassword = userExist.passwordHash;
    if (req.body.password) {
      newPassword = bcrypt.hashSync(req.body.password, 10);
    }

    const updatedUser = {
      name: req.body.name || userExist.name,
      email: req.body.email || userExist.email,
    };

    const user = await User.findByIdAndUpdate(req.params.id, updatedUser, {
      new: true,
    });

    if (!user) return res.status(400).send("The user cannot be updated!");

    console.log("User updated successfully:", user);
    res.status(200).send(user);
  } catch (error) {
    console.error("Error during user update:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

// Delete a user
router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error during user deletion:", error.message);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});

module.exports = router;
