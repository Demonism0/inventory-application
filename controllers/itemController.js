const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const Item = require('../models/item');
const Category = require('../models/category');

exports.index = asyncHandler(async (req, res, next) => {
  // Get number of items and categories (in parallel).
  const [numItems, numCategories] = await Promise.all([
    Item.countDocuments({}).exec(),
    Category.countDocuments({}).exec(),
  ]);

  res.render('index', {
    title: 'Inventory Application Home',
    item_count: numItems,
    category_count: numCategories,
  });
});

// Display list of all Items.
exports.itemList = asyncHandler(async (req, res, next) => {
  const allItems = await Item.find({}, 'name description')
    .sort({ name: 1 })
    .exec();

  res.render('item_list', {
    title: 'Item List',
    item_list: allItems,
  });
});

// Display detail page for a specific Item.
exports.itemDetail = asyncHandler(async (req, res, next) => {
  // Get details of item
  const item = await Item.findById(req.params.id)
    .populate('category')
    .exec();

  if (item === null) {
    // No results.
    const err = new Error('Item not found');
    err.status = 404;
    return next(err);
  }

  res.render('item_detail', {
    title: 'Item Detail',
    item,
  });
});

// Display Item create form on GET.
exports.itemCreateGET = asyncHandler(async (req, res, next) => {
  // Get all categories, which we can use for adding to our item
  const allCategories = await Category.find().sort({ name: 1 }).exec();

  res.render('item_form', {
    title: 'Create Item',
    category_list: allCategories,
  });
});

// Handle Item create on POST.
exports.itemCreatePOST = [
  // Convert the category to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category = typeof req.body.category === 'undefined'
        ? []
        : [req.body.category];
    }
    next();
  },

  // Validate and sanitize fields.
  body('name', 'Name must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('description', 'Description must have at least 3 characters.')
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body('price')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Price must not be empty.')
    .matches('\\$\\d+(?:\\.\\d+)?')
    .withMessage('Price must match the format $9.99')
    .escape(),
  body('stock')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Stock must not be empty.')
    .isNumeric()
    .withMessage('Stock can only contain numbers')
    .escape(),
  body('category.*')
    .escape(),

  // Process request after validation and sanitization
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a new item with escaped and trimmed data.
    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      category: req.body.category,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized/escaped messages.

      // Get all categories again for form.
      const allCategories = await Category.find().sort({ name: 1 }).exec();

      // Mark our selected categories as checked.
      for (const category of allCategories) {
        if (item.category.includes(category._id)) {
          category.checked = 'true';
        }
      }
      res.render('item_form', {
        title: 'Create Item',
        category_list: allCategories,
        item,
        errors: errors.array(),
      });
    } else {
      // Data from form is valid. Save item.
      await item.save();
      res.redirect(item.url);
    }
  }),
];

// Display Item delete form on GET.
exports.itemDeleteGET = asyncHandler(async (req, res, next) => {
  // Get details of item
  const item = await Item.findById(req.params.id).exec();

  if (item === null) {
    // No results.
    res.redirect('/inventory/items');
  }

  res.render('item_delete', {
    title: 'Delete Item',
    item,
  });
});

// Handle Item delete on POST.
exports.itemDeletePOST = asyncHandler(async (req, res, next) => {
  // Delete object and redirect to list of items
  await Item.findByIdAndDelete(req.body.itemid);
  res.redirect('/inventory/items');
});

// Display Item update form on GET.
exports.itemUpdateGET = asyncHandler(async (req, res, next) => {
  // Get item, categories for form
  const [item, allCategories] = await Promise.all([
    Item.findById(req.params.id).exec(),
    Category.find().sort({ name: 1 }).exec(),
  ]);

  if (item === null) {
    // No results.
    const err = new Error('item not found');
    err.status = 404;
    return next(err);
  }

  // Mark our selected categories as checked.
  allCategories.forEach((category) => {
    if (item.category.includes(category._id)) {
      category.checked = 'true';
    }
  });

  res.render('item_form', {
    title: 'Update Item',
    item,
    category_list: allCategories,
  });
});

// Handle Item update on POST.
exports.itemUpdatePOST = [
  // Convert the category to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.category)) {
      req.body.category = typeof req.body.category === 'undefined'
        ? []
        : [req.body.category];
    }
    next();
  },

  // Validate and sanitize fields.
  body('name', 'Name must not be empty.')
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body('description', 'Description must have at least 3 characters.')
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body('price')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Price must not be empty.')
    .matches('\\$\\d+(?:\\.\\d+)?')
    .withMessage('Price must match the format $9.99')
    .escape(),
  body('stock')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Stock must not be empty.')
    .isNumeric()
    .withMessage('Stock can only contain numbers')
    .escape(),
  body('category.*')
    .escape(),

  // Process request after validation and sanitization
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create an Item object with escaped/trimmed data and old id.
    const item = new Item({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      category: typeof req.body.category === 'undefined'
        ? []
        : req.body.category,
      _id: req.params.id, // This is required, or a new id will be assigned
    });

    if (!errors.isEmpty()) {
      // There are errors, render form again with sanitized values/error messages.

      // Get all categories for form
      const allCategories = await Category.find().sort({ name: 1 }).exec();

      // Mark our selected categories as checked.
      for (const category of allCategories) {
        if (item.category.indexOf(category._id) > -1) {
          category.checked = 'true';
        }
      }

      res.render('item_form', {
        title: 'Update Item',
        category_list: allCategories,
        item,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid. Update the record
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, item, {});

    // Redirect to item detail page.
    res.redirect(updatedItem.url);
  }),
];
