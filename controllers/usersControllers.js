import User from '../models/user.js';
import Query from '../models/Query.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// coins function to get user points
export const pointsUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id, "coins");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ coins: user.coins });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user points" });
  }
}
// user search history
// export const getUserSearchHistory = async (req, res) => {
//   // const {userId} = req.body
//   // console.log(userId,"userID")
//   try {
//     const user = await User.findById(req.user.id, "searchHistory");
//     if (!user) return res.status(404).json({ meesage: "History not found" })
//     res.json({ searchHistory: user.searchHistory });
//   } catch (error) {
//     res.status(500).json({ message: "Error retrieving search history" });
//   }
// }
export const getUserSearchHistory = async (req, res) => {
  const { page = 1 } = req.query; // Get the page number from query params (default is 1)

  try {
    const user = await User.findById(req.user.id, "searchHistory");
    if (!user) return res.status(404).json({ message: "History not found" });

    // Paginate search history
    const limit = 10;
    const startIndex = (page - 1) * limit;
    const paginatedHistory = user.searchHistory.slice(startIndex, startIndex + limit);

    res.json({
      searchHistory: paginatedHistory,
      totalQueries: user.searchHistory.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(user.searchHistory.length / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving search history" });
  }
};

// user queries
// export const getQueries = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id, "queries");
//     const query = await Query.find({ userId: user._id, status: "answered" });
//     if (!user) return res.status(404).json({ message: "User not found" });
//     res.json({ queries: query });
//   }
// catch (error) {
//     res.status(500).json({ message: "Error retrieving user queries" });
//   }
// }
export const getQueries = async (req, res) => {
  const { page = 1 } = req.query; // Get the page number from query params (default is 1)
  const limit = 10; // Number of queries per page

  try {
    const user = await User.findById(req.user.id, "queries");
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalQueries = await Query.countDocuments({ userId: user._id, status: "answered" }); // Total queries count
    const queries = await Query.find({ userId: user._id, status: "answered" })
      .skip((page - 1) * limit) // Skip the previous pages' queries
      .limit(limit); // Limit to 10 queries per page

    res.json({
      queries,
      totalQueries,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalQueries / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user queries" });
  }
};






















// user signup 
export const userSignUp = async (req, res) => {
  const { name, email, password, phoneNumber, registrationSource } = req.body;
  
  console.log(name, email, password, phoneNumber, registrationSource);
  
  // if (!email || !password) {
  //   return res.status(400).json({ message: "All fields are required" });
  // }

  const hashPassword = await bcrypt.hash(password, 10);

  try {
    // Check if user exists with the same email & source OR phone & source
    const existingUser = await User.findOne({
      $or: [
        { email, registrationSource },
        { phoneNumber, registrationSource }
      ]
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already registered with this source" });
    }

    const user = await User.create({
      name,
      email,
      password: hashPassword,
      phoneNumber,
      registrationSource
    });
    return res.status(201).json({ message: "User created successfully" });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ error: error.message });
  }
};
// user login
export const userLogin = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  // Check if input exists
  if (!emailOrPhone || !password) {
    return res.status(400).json({ error: "Email/Phone and password are required" });
  }

  try {
    // Find user by email OR phone number
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }]
    });

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY, { expiresIn: "1h" });

    // Set secure cookie with token
    // res.cookie("access_token", token, { sameSite: "strict" });

    return res.status(200).json({ message: "Login successful", token });

  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
