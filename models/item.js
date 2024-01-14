const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true, maxLength: 100 },
  description: { type: String },
  price: { type: String },
  stock: { type: Number },
  category: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
});

// Virtual for item's URL
ItemSchema.virtual('url').get(function () {
  return `/inventory/item/${this._id}`;
});

module.exports = mongoose.model('Item', ItemSchema);
