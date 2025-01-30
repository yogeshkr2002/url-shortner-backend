const Analytics = require("../models/Analytics.model");
const Link = require("../models/Link.model");

exports.getLinkAnalytics = async (req, res) => {
  try {
    const { linkId } = req.params;

    const link = await Link.findOne({ _id: linkId, userId: req.user._id });
    if (!link) {
      return res.status(404).json({ message: "Link not found" });
    }

    const analytics = await Analytics.find({ linkId }).sort({ timestamp: -1 });

    res.json(analytics);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching analytics", error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const links = await Link.find({ userId: req.user._id });
    const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const clicksByDate = await Analytics.aggregate([
      {
        $match: {
          linkId: { $in: links.map((link) => link._id) },
          timestamp: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get clicks by device
    const clicksByDevice = await Analytics.aggregate([
      {
        $match: {
          linkId: { $in: links.map((link) => link._id) },
        },
      },
      {
        $group: {
          _id: "$userDevice",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      totalClicks,
      clicksByDate,
      clicksByDevice,
    });
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error fetching dashboard stats",
        error: error.message,
      });
  }
};

exports.getAllAnalytics = async (req, res) => {
  try {
    // Get all links for this user
    const userLinks = await Link.find({ userId: req.user._id });
    const linkIds = userLinks.map((link) => link._id);

    // Get analytics with populated link details
    const analytics = await Analytics.find({ linkId: { $in: linkIds } })
      .populate("linkId", "originalUrl shortHash")
      .sort({ timestamp: -1 });

    // Format the response
    const formattedAnalytics = analytics
      .filter((record) => record.linkId)
      .map((record) => ({
        _id: record._id,
        timestamp: new Date(record.timestamp).toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        link: {
          originalUrl: record.linkId.originalUrl,
          shortHash: record.linkId.shortHash,
        },
        ipAddress: "192.158.1.38",
        userDevice: record.userDevice,
      }));

    res.json(formattedAnalytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res
      .status(500)
      .json({ message: "Error fetching analytics", error: error.message });
  }
};
