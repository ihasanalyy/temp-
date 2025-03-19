import express from 'express';
import { vendorLogin, vendorSignUp } from '../controllers/vendorCrudOpt.js';

const router = express.Router();

// vendor singup route
router.post('/signup', vendorSignUp);

// vendor login route
router.post('/login', vendorLogin);

export default router;
// Description: This file contains the routes for vendor authentication.
// The file contains two routes: signup and login.
// The signup route is used to create a new vendor account in the database.
// The login route is used to authenticate the vendor and generate a token for session management.
// The routes handle the request and response using the express router.
// The routes use the vendor model to interact with the database.
// The routes are exported to be used in the main index.js file.