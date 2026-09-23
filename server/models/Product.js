import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  modelCode: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  categorySlug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  regularPrice: {
    type: Number,
    required: true
  },
  salePrice: {
    type: Number,
    required: true
  },
  discountPercentage: {
    type: Number,
    default: function() {
      if (this.regularPrice && this.salePrice && this.regularPrice > this.salePrice) {
        return Math.round(((this.regularPrice - this.salePrice) / this.regularPrice) * 100);
      }
      return 0;
    }
  },
  images: [{
    type: String,
    required: true
  }],
  badge: {
    type: String,
    enum: ['', 'Sale', 'Hot', 'New', 'Cat-Ear', 'Best Seller'],
    default: ''
  },
  inStock: {
    type: Boolean,
    default: true
  },
  stockCount: {
    type: Number,
    default: 15
  },
  rating: {
    type: Number,
    default: 4.8
  },
  reviewCount: {
    type: Number,
    default: 24
  },
  shortDesc: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  features: [{
    type: String
  }],
  specs: {
    driver: { type: String, default: '50mm Neodymium' },
    connectivity: { type: String, default: '3.5mm Audio + USB (LED Power)' },
    lighting: { type: String, default: 'RGB Multi-color Breathing' },
    microphone: { type: String, default: 'Omnidirectional Noise-canceling' },
    compatibility: { type: String, default: 'PC, PS4, PS5, Xbox One, Nintendo Switch, Mobile' },
    cableLength: { type: String, default: '2.2m Braided Cable' },
    weight: { type: String, default: '360g' }
  },
  isDeal: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isCatEarSpecial: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Calculate discount before saving
productSchema.pre('save', function(next) {
  if (this.regularPrice && this.salePrice && this.regularPrice > this.salePrice) {
    this.discountPercentage = Math.round(((this.regularPrice - this.salePrice) / this.regularPrice) * 100);
  }
  next();
});

export default mongoose.model('Product', productSchema);
