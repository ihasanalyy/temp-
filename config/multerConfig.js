    import multer from "multer";

    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    export default upload;
//     import { v2 as cloudinary } from 'cloudinary';
//     import streamifier from 'streamifier';
//     import dotenv from 'dotenv';
    
//     dotenv.config(); // Load environment variables from .env file
    
// cloudinary.config({
//     cloud_name: 'dpsxv4fmn',
//     api_key: '674392325678217',
//     api_secret: '6KhvEX2F0eULk-1VKcGB3eysv6c'
// });
    
//     const uploadToCloudinary = (buffer) => {
//       return new Promise((resolve, reject) => {
//         const stream = cloudinary.uploader.upload_stream((error, result) => {
//           if (error) return reject(error);
//           resolve(result.secure_url);
//         });
    
//         streamifier.createReadStream(buffer).pipe(stream);
//       });
//     };
    
//     export default uploadToCloudinary;