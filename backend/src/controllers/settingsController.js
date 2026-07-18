const asyncHandler = require('../middlewares/asyncHandler');
const Settings = require('../models/Settings');

// @desc    Get platform settings
// @route   GET /api/v1/admin/settings
// @access  Private (admin)
const getSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.json({ success: true, data: settings });
});

// @desc    Update platform settings
// @route   PUT /api/v1/admin/settings
// @access  Private (admin)
const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();

  const editable = [
    'platformCommissionPercent', 'minimumOrderAmount', 'supportEmail', 'supportPhone',
    'maintenanceMode', 'maintenanceMessage', 'allowNewRegistrations',
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) settings[field] = req.body[field];
  });

  await settings.save();
  res.json({ success: true, message: 'Settings updated', data: settings });
});

// @desc    Public: check maintenance mode (so the frontend can show a banner without admin auth)
// @route   GET /api/v1/settings/public
// @access  Public
const getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.getSingleton();
  res.json({
    success: true,
    data: {
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      allowNewRegistrations: settings.allowNewRegistrations,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
    },
  });
});

module.exports = { getSettings, updateSettings, getPublicSettings };
