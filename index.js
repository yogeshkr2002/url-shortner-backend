const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const limiter = require("./middleware/rateLimiter");
require("dotenv").config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://url-shortner-bice-xi.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: Access denied"), false);
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(limiter);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const Link = require("./models/Link.model");
const Analytics = require("./models/Analytics.model");

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/links", require("./routes/links.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));

app.get("/api/test-analytics", async (req, res) => {
  try {
    const analytics = await Analytics.find().populate("linkId");
    console.log("All analytics:", analytics);
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/:shortHash", async (req, res) => {
  try {
    const { shortHash } = req.params;
    console.log("1. Received request for shortHash:", shortHash);

    if (shortHash.startsWith("api")) {
      console.log("Skipping API route");
      return res.status(404).json({ message: "Not found" });
    }

    const link = await Link.findOne({ shortHash });
    console.log("2. Found link:", link);

    if (!link) {
      console.log("3. Link not found");
      return res.status(404).json({ message: "Link not found" });
    }

    if (link.expirationDate && new Date() > new Date(link.expirationDate)) {
      return res.status(410).json({ message: "Link has expired" });
    }

    const userAgent = req.headers["user-agent"]?.toLowerCase() || "";
    let userDevice = "Chrome";

    if (userAgent.includes("android")) {
      userDevice = "Android";
    } else if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
      userDevice = "iOS";
    } else if (userAgent.includes("chrome")) {
      userDevice = "Chrome";
    }
    console.log("3. Detected device:", userDevice);

    try {
      const analyticsRecord = new Analytics({
        linkId: link._id,
        ipAddress: "192.158.1.38",
        userAgent: userAgent,
        userDevice: userDevice,
        timestamp: new Date(),
      });

      await analyticsRecord.save();
      console.log("4. Analytics saved successfully:", analyticsRecord._id);
    } catch (analyticsError) {
      console.error("Error saving analytics:", analyticsError);
    }

    try {
      await Link.findByIdAndUpdate(link._id, { $inc: { clicks: 1 } });
      console.log("5. Click count updated");
    } catch (updateError) {
      console.error("Error updating click count:", updateError);
    }

    let redirectUrl = link.originalUrl;
    if (!redirectUrl.match(/^https?:\/\//i)) {
      redirectUrl = "https://" + redirectUrl;
    }

    console.log("6. Redirecting to:", redirectUrl);

    return res.status(302).redirect(redirectUrl);
  } catch (error) {
    console.error("Main redirect error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
