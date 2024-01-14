const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

const Item = require('../models/item');
const Category = require('../models/category');

// Display list of all Categories.
exports.categoryList = asyncHandler(async (req, res, next) => {
  const [allCategories, allItems] = await Promise.all([
    Category.find()
      .sort({ name: 1 })
      .exec(),
    Item.find()
      .exec(),
  ]);

  const countItems = (category, itemList) => {
    let count = 0;
    for (let i = 0; i < itemList.length; i += 1) {
      if (allItems[i].category.includes(category._id)) {
        count += 1;
      }
    }
    return count;
  };

  res.render('category_list', {
    title: 'Category List',
    category_list: allCategories,
    item_list: allItems,
    countItems,
  });
});

// Display detail page for a specific Category.
exports.categoryDetail = asyncHandler(async (req, res, next) => {
  // Get details of category and all associated items (in parallel).
  const [category, itemsInCategory] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Item.find({ category: req.params.id }, 'name description').exec(),
  ]);
  if (category === null) {
    // no results.
    const err = new Error('Category not found');
    err.status = 404;
    return next(err);
  }

  res.render('category_detail', {
    title: 'Category Detail',
    category,
    category_items: itemsInCategory,
  });
});

// Display Category create form on GET.
exports.categoryCreateGET = (req, res, next) => {
  res.render('category_form', { title: 'Create Category' });
};

// Handle Category create on POST.
exports.categoryCreatePOST = [
  // Validate and sanitize the name field.
  body('name', 'Category name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    // Create a category object with escaped and trimmed data.
    const category = new Category({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('category_form', {
        title: 'Create Category',
        category,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid.
    // Check if Category with same name already exists.
    const categoryExists = await Category.findOne({ name: req.body.name })
      .collation({ locale: 'en', strength: 2 })
      .exec();

    if (categoryExists) {
      // Category exists, redirect to its detail page.
      res.redirect(categoryExists.url);
    } else {
      await category.save();
      // New category saved. Redirect to category detail page.
      res.redirect(category.url);
    }
  }),
];

// Display Category delete form on GET.
exports.categoryDeleteGET = asyncHandler(async (req, res, next) => {
  // Get details of category and all its items (in parallel)
  const [category, allItemsInCategory] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Item.find({ category: req.params.id }, 'name description').exec(),
  ]);

  if (category === null) {
    // No results.
    res.redirect('/inventory/categories');
  }

  res.render('category_delete', {
    title: 'Delete Category',
    category,
    category_items: allItemsInCategory,
  });
});

// Handle Category delete on POST.
exports.categoryDeletePOST = asyncHandler(async (req, res, next) => {
  // Get details of category and all its items (in parallel)
  const [category, allItemsInCategory] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Item.find({ category: req.params.id }, 'name description').exec(),
  ]);

  if (allItemsInCategory.length > 0) {
    // Category has items. Render in same way as for GET route
    res.render('category_delete', {
      title: 'Delete Category',
      category,
      category_items: allItemsInCategory,
    });
    return;
  }

  // Category has no items. Delete category and redirect to list of categories
  await Category.findByIdAndDelete(req.body.categoryid);
  res.redirect('/inventory/categories');
});

// Display Category update form on GET.
exports.categoryUpdateGET = asyncHandler(async (req, res, next) => {
  // Get category for form
  const category = await Category.findById(req.params.id).exec();

  if (category === null) {
    // No results.
    const err = new Error('Category not found')
    err.status = 404;
    return next(err);
  }

  res.render('category_form', {
    title: 'Update Category',
    category,
  });
});

// Handle Category update on POST.
exports.categoryUpdatePOST = [
  // Validate and sanitize fields.
  body('name', 'Category name must contain at least 3 characters')
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization
  async (req, res, next) => {
    // Extract the validation errors from a request
    const errors = validationResult(req);

    // Create a new Category object with escaped/trimmed data and old id.
    const category = new Category({
      name: req.body.name,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('category_form', {
        title: 'Update Category',
        category,
        errors: errors.array(),
      });
      return;
    }

    // Data from form is valid. Update the record
    const updatedCategory = await Category.findByIdAndUpdate(req.params.id, category, {});

    // Redirect to category detail page.
    res.redirect(updatedCategory.url);
  },
];
