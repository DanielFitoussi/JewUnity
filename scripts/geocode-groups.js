require('dotenv').config();
const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const Group = require('../models/groups');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jewunity';

async function geocodeAddress(address) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'jewunity-app/1.0'
    }
  });

  const data = await response.json();

  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon)
    };
  }

  return null;
}

async function updateGroupsWithLocation() {
  await mongoose.connect(MONGO_URI);
  const groups = await Group.find({ address: { $exists: true }, location: { $exists: false } });

  for (const group of groups) {
    if (!group.address) continue;

    console.log(`📍 מעבד: ${group.name} (${group.address})`);
    const location = await geocodeAddress(group.address);

    if (location) {
      group.location = location;
      await group.save();
      console.log(`✅ עודכן: ${group.name} →`, location);
    } else {
      console.warn(`❌ לא נמצאה כתובת עבור: ${group.name}`);
    }
  }

  await mongoose.disconnect();
  console.log('🎉 סיום.');
}

updateGroupsWithLocation();
