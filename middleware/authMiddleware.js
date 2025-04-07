// import jwt from 'jsonwebtoken';

// const authMiddleware = (req, res, next) => {
//     const token = req.cookies.access_token;
//     console.log(req,"cookie")
//     if (!token) {
//       return res.status(401).json({ message: "Unauthorized access" });
//     }
//     try {
//       const verified = jwt.verify(token, process.env.SECRET_KEY);
//       console.log(verified,"verified")
//       req.user = verified;
//       next();
//     } catch (error) {
//       res.status(400).json({ message: "Invalid token" });
//     }
//   };
// export default authMiddleware;

import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized access: Token missing or malformed" });
  }

  const token = authHeader.split(" ")[1]; // Extract token after "Bearer "

  try {
    const verified = jwt.verify(token, process.env.SECRET_KEY);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: "Invalid token" });
  }
};

export default authMiddleware;
