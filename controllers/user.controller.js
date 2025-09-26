const customerModel = require("../models/user.model");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Load secrets
const JWT_SECRET = process.env.JWT_SECRET || "fallbacksecret";
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

exports.getSignup = (req, res) => {
  res.render("signup");
};

exports.getDashboard = (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ status: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    jwt.verify(token, JWT_SECRET, async (err, result) => {
      if (err) {
        console.error("JWT error:", err);
        return res.status(401).json({
          status: false,
          message: "Token is expired or invalid",
          error: err.message,
        });
      }

      try {
        const foundCustomer = await customerModel.findOne({
          email: result.email,
        });
        if (!foundCustomer) {
          return res
            .status(404)
            .json({ status: false, message: "Customer not found" });
        }
        return res.json({
          status: true,
          message: "Token is valid",
          customer: {
            id: foundCustomer._id,
            firstName: foundCustomer.firstName,
            email: foundCustomer.email,
          },
        });
      } catch (dbErr) {
        console.error("DB error:", dbErr);
        return res.status(500).json({ message: "DB lookup failed" });
      }
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.postRegister = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;
    if (!firstName || !email || !password) {
      return res
        .status(400)
        .json({ message: "First name, email and password are required" });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const newCustomer = new customerModel({
      ...req.body,
      password: hashedPassword,
    });

    await newCustomer.save();
    console.log("✅ Customer registered successfully:", newCustomer.email);

    // Send confirmation email
    if (EMAIL_USER && EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: EMAIL_USER,
        to: [email, "michaeloluwaseyi900@gmail.com"],
        subject: "Welcome to our app!",
        text: `Hello ${firstName}, thanks for signing up!`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("❌ Email error:", error);
        } else {
          console.log("📩 Email sent:", info.response);
        }
      });
    } else {
      console.warn("⚠️ Email not sent - EMAIL_USER/PASS not configured");
    }

    return res.redirect("/user/login");
  } catch (err) {
    console.error("🔥 Error registering customer:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

exports.getLogin = (req, res) => {
  res.render("signin");
};

exports.postSignin = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🟢 Login attempt:", email);

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const foundCustomer = await customerModel.findOne({ email });
    if (!foundCustomer) {
      console.log("❌ Invalid email:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = bcrypt.compareSync(password, foundCustomer.password);
    if (!isMatch) {
      console.log("❌ Invalid password for:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "1h" });
    console.log("✅ Login successful for:", email);

    return res.json({
      message: "Login successful",
      user: {
        id: foundCustomer._id,
        firstName: foundCustomer.firstName,
        email: foundCustomer.email,
        token,
      },
    });
  } catch (err) {
    console.error("🔥 Error logging in:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};
