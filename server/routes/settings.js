import express from 'express';
import Setting from '../models/Setting.js';
import { getMongoStatus, fallbackStore } from '../db/connect.js';

const router = express.Router();

// GET all store settings
router.get('/', async (req, res) => {
  try {
    if (getMongoStatus()) {
      const settingsDocs = await Setting.find();
      const settingsObj = {};
      settingsDocs.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      // Ensure hotline is always 9864006883 by default if missing
      settingsObj.hotline = settingsObj.hotline || '9864006883';
      settingsObj.whatsapp = settingsObj.whatsapp || '9864006883';
      return res.json({ success: true, data: settingsObj });
    }
    return res.json({ success: true, data: fallbackStore.settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update store settings
router.put('/', async (req, res) => {
  try {
    const updates = req.body;

    if (getMongoStatus()) {
      for (const [key, value] of Object.entries(updates)) {
        await Setting.findOneAndUpdate(
          { key },
          { $set: { key, value } },
          { upsert: true, new: true }
        );
      }
      const updatedDocs = await Setting.find();
      const settingsObj = {};
      updatedDocs.forEach(s => {
        settingsObj[s.key] = s.value;
      });
      return res.json({ success: true, data: settingsObj });
    }

    fallbackStore.settings = {
      ...fallbackStore.settings,
      ...updates
    };
    return res.json({ success: true, data: fallbackStore.settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
