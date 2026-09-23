import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  customer: {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    address: { type: String, required: true, trim: true },
    city: { type: String, default: 'Kathmandu', trim: true },
    district: { type: String, default: 'Kathmandu' },
    province: { type: String, default: 'Bagmati' },
    notes: { type: String, default: '' }
  },
  items: [{
    productId: { type: String },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    image: { type: String }
  }],
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: {
    type: String,
    enum: ['cod', 'esewa', 'khalti', 'fonepay', 'whatsapp'],
    default: 'cod'
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Processing', 'Dispatched', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Pending'
  },
  stockDeducted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);
