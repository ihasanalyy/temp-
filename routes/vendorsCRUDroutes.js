import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { deleteVendor,updateVendor,getHistoryVendor } from '../controllers/vendorCrudOpt.js';

const router = express.Router()

// CRUD operations for vendors
router.delete('/deleteShop',authMiddleware, deleteVendor);
router.put('/updateShop',authMiddleware, updateVendor);
router.get('/history',authMiddleware, getHistoryVendor);


export default router;