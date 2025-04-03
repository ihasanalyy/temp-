import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
    const token = req.cookies.access_token;
    console.log(req.headers,"cookie")
    if (!token) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    try {
      const verified = jwt.verify(token, process.env.SECRET_KEY);
      console.log(verified,"verified")
      req.user = verified;
      next();
    } catch (error) {
      res.status(400).json({ message: "Invalid token" });
    }
  };
export default authMiddleware;

// Description: This file contains the middleware function that checks if the user is authenticated or not.
// The middleware function checks if the token is present in the header of the request.
// If the token is present, it verifies the token using the secret key and adds the user object to the request object.
// If the token is not present or invalid, it returns an error message.
