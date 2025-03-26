import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { openShop, search, openShopDetails, openPriceDetails } from '../controllers/search.js';

const router = express.Router();

// search route
router.post('/query', authMiddleware, search);

// open specific/relevent vendor shop
router.get('/shop/:queryId', authMiddleware, openShop);

// open specific/relevent vendor shop details
router.get('/shop/shopDetails/:queryId', authMiddleware, openShopDetails);

// open specific/relevent vendor shop price details
router.get('/shop/priceDetails/:queryId', authMiddleware, openPriceDetails);

export default router;
