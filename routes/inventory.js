const express = require('express');

const router = express.Router();

// Require controller modules.
const itemController = require('../controllers/itemController');
const categoryController = require('../controllers/categoryController');

/// ITEM ROUTES ///

// GET inventory home page.
router.get('/', itemController.index);

// GET request for creating a Item. NOTE This must come before routes that display Item (uses id).
router.get('/item/create', itemController.itemCreateGET);

// POST request for creating Item.
router.post('/item/create', itemController.itemCreatePOST);

// GET request to delete Item.
router.get('/item/:id/delete', itemController.itemDeleteGET);

// POST request to delete Item.
router.post('/item/:id/delete', itemController.itemDeletePOST);

// GET request to update Item.
router.get('/item/:id/update', itemController.itemUpdateGET);

// POST request to update Item.
router.post('/item/:id/update', itemController.itemUpdatePOST);

// GET request for one Item.
router.get('/item/:id', itemController.itemDetail);

// GET request for list of all Item items.
router.get('/items', itemController.itemList);

/// AUTHOR ROUTES ///

// GET request for creating Category. This must come before route for id (i.e. display category).
router.get('/category/create', categoryController.categoryCreateGET);

// POST request for creating Category.
router.post('/category/create', categoryController.categoryCreatePOST);

// GET request to delete Category.
router.get('/category/:id/delete', categoryController.categoryDeleteGET);

// POST request to delete Category.
router.post('/category/:id/delete', categoryController.categoryDeletePOST);

// GET request to update Category.
router.get('/category/:id/update', categoryController.categoryUpdateGET);

// POST request to update Category.
router.post('/category/:id/update', categoryController.categoryUpdatePOST);

// GET request for one Category.
router.get('/category/:id', categoryController.categoryDetail);

// GET request for list of all Categories.
router.get('/categories', categoryController.categoryList);

module.exports = router;
