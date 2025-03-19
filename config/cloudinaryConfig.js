import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

cloudinary.config({
    cloud_name: 'dpsxv4fmn',
    api_key: '674392325678217',
    api_secret: '6KhvEX2F0eULk-1VKcGB3eysv6c',
    timeout: 60000,
});
export default cloudinary
