import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudianry } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("email:", email);

  if ([fullName, email, username, password].some(field => !field?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
   const avatarLocalPath=req.files?.avatar[0]?.path
const coverImageLocalPath=req.files?.coverImage[0]?.path
if(!avatarLocalPath){
    throw new ApiError(400,"avatar is required")
}
const avatar= await uploadOnCloudianry(avatarLocalPath)
const coverImage= await uploadOnCloudianry(coverImageLocalPath)
if(!avatar){
    throw new ApiError(500,"Error in uploading avatar image")   
}
 const user = await User.create({
  fullName, 
  avatar:avatar.url,
  coverImage:coverImage?.url|| " ",
  email,
  password,
username: username.toLowerCase()
})
const createdUser = await User.findById(user._id).select(
    "-password -refreshTokens"
)
if(!createdUser){
    throw new ApiError(500,"something went wrong while registering user")
}
return res.status(201).json(new ApiResponse(201,createdUser,"user registered successfully"));

});

export { registerUser };
