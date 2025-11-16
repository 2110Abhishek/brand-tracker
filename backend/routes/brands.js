const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Mention = require('../models/Mention'); 

// Get all brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find();
    res.json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new brand
router.post('/', async (req, res) => {
  try {
    const { name, keywords, socialMediaHandles } = req.body;
    
    const brand = new Brand({
      name,
      keywords: keywords || [],
      socialMediaHandles: socialMediaHandles || []
    });

    const savedBrand = await brand.save();
    res.status(201).json(savedBrand);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Brand name already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Add sample brands if none exist
router.post('/initialize', async (req, res) => {
  try {
    const existingBrands = await Brand.countDocuments();
    if (existingBrands === 0) {
      const sampleBrands = [
        { name: 'Nike', keywords: ['sports', 'shoes', 'apparel'], socialMediaHandles: ['@nike'] },
        { name: 'Apple', keywords: ['technology', 'iphone', 'macbook'], socialMediaHandles: ['@apple'] },
        { name: 'Starbucks', keywords: ['coffee', 'cafe', 'beverages'], socialMediaHandles: ['@starbucks'] }
      ];

      await Brand.insertMany(sampleBrands);
      res.json({ message: 'Sample brands added successfully' });
    } else {
      res.json({ message: 'Brands already exist' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update brand
router.put('/:id', async (req, res) => {
  try {
    const { name, keywords, socialMediaHandles } = req.body;
    
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      {
        name,
        keywords: keywords || [],
        socialMediaHandles: socialMediaHandles || []
      },
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json(brand);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Brand name already exists' });
    } else {
      res.status(400).json({ message: error.message });
    }
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  console.log('DELETE /api/brands/' + req.params.id + ' called');
  try {
    // First, let's check if the ID format is valid
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid ID format:', req.params.id);
      return res.status(400).json({ message: 'Invalid brand ID format' });
    }

    // Let's first try to find the brand to see what's happening
    const brand = await Brand.findById(req.params.id);
    console.log('Found brand:', brand);
    
    if (!brand) {
      // Let's list all brands to see what's in the database
      const allBrands = await Brand.find({}, '_id name');
      console.log('All brands in database:', allBrands);
      return res.status(404).json({ message: 'Brand not found' });
    }

    // If we found the brand, then delete it
    await Brand.findByIdAndDelete(req.params.id);
    await Mention.deleteMany({ brandName: brand.name });

    res.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE route:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;