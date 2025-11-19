import { asyncHandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudianry } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt  from 'bcrypt';
import jwt from 'jsonwebtoken'; 

const generateAccessTokenAndRefreshToken= async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken= user.genarateRefreshToken()
    user.refreshToken=refreshToken
    await user.save({validateBeforeSave:false})
    return{accessToken,refreshToken}
  } catch (error) {
    throw new ApiError(500,"something went wrong while generating refresh and access token")
  }
}

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
// const coverImageLocalPath=req.files?.coverImage[0]?.path
let coverImageLocalPath;
if(req.files&&Array.isArray(req.files.coverImage)&& req.files.coverImage.length>0){
    coverImageLocalPath=req.files.coverImage[0].path
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
const loginUser = asyncHandler(async(req,res)=>{
//1.req body  => data 
// username  or email
// find the user 
//  password check 
// access and refreshtoken
//  send the cookie 
const {email,username,password}=req.body
if(!username&&!email){
  throw new ApiError(400,"username or email  are required")
}
const user = await User.findOne({
  $or:[{username},{email}]
})
if(!user){
  throw new ApiError(404,"user does not exist")
}
const isPasswordValid= await user.isPasswordcorrect(password)
if(!isPasswordValid){
  throw new ApiError(401,"invalid password")
}
const {accessToken,refreshToken}=await generateAccessTokenAndRefreshToken(user._id)
console.log(accessToken, "accessToken")
console.log(refreshToken, "refreshToken")

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
const options= {
  httpOnly:true,
  secure:true
}
return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
.json(new ApiResponse(200,{
  user:loggedInUser,accessToken,refreshToken

},"user logged in successfully"))
})
const logoutUser= asyncHandler(async(req,res)=>{
   await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{refreshTokens:undefined}
    }
   )
   const options={
    httpOnly:true,
    secure:true
   }
   return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options).json(new ApiResponse(200,{},"user logged out successfully")) 
})
const refreshAccessToken= asyncHandler(async(req,res)=>{
 const incomingRefreshToken= req.cookies.refreshToken||req.body.refreshToken
 if(!incomingRefreshToken){
  throw new ApiError(401,"unauthorized request")
 }
 try {
  const decodedToken=jwt.verify(
   incomingRefreshToken,
   process.env.REFRESH_TOKEN_SECRET
  )
  const user=User.findById(decodedToken?._id)
  if(!user){
   throw new ApiError(404,"user does not exist")
  }
  if(incomingRefreshToken!==user?.refreshToken){
   throw new ApiError(401,"Refresh token  is expired or used")
  }
  const options={
   httpOnly:true,
   secure:true
  }
  
  const{accessToken,newrefreshToken}=await generateAccessTokenAndRefreshToken(user._id)
  return res.status(200).cookie("accessToken",accessToken)
  .cookie("refreshToken",newrefreshToken,options).json(new ApiResponse(200,{accessToken,newrefreshToken},"access token refreshed successfully"))
 } catch (error) {
  throw new ApiError(401,error?.message||"invalid refresh token")
 }
})
const changesCurrentPassword= asyncHandler(async(req,res)=>{
  const{oldPassword,newPassword}= req.body
  const user=User.findById(req.user?._id)
 const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)
 if(!isPasswordCorrect){
  throw new ApiError(400,"invalid old password")
 }
 user.password=newPassword
 await user.save({validateBeforeSave:true})
   return res.status(200).json(new ApiResponse(200,{},"password changed successfully"))
})
const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200).json(200,req.user,"current user fetched successfully")
})
const updateAccountDetails= asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!fullName||!email){
    throw new ApiError(400,"all feilds are required") 
  }
  const  user = User.findByIdAndUpdate(req.user?._id,{$set:{
    fullName,email
  }},{new:true}).select("-password")
  return res.status(200).json(new ApiResponse(200,user,"Account details updated successfully"))
})
const updateUserAvatar = asyncHandler(async(req,res)=>{
  const avatarLocalPath  =req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400,"avatar file is missing")
  }
  const avatar = await uploadOnCloudianry(avatarLocalPath)
  console.log(avatar, "avatar")
  if(!avatar.url){
    throw new ApiError(500,"error in uploading avatar image") 
  }
  const user =await User.findByIdAndUpdate(req.user?._id,
    {
      $set:{avatar:avatar.url}

  },{new:true}).select("-password")
  return res.status(200).json(
    new ApiResponse(200,user,"avatar image updated sucessfully")
  )
})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400,"cover image file is missing")
  }
  const coverImage = await uploadOnCloudianry(coverImageLocalPath)
  if(!coverImage.url){
    throw new ApiError(500,"error in uploading cover image ")
  }
 const user = await User.findByIdAndUpdate(req.user?._id,{
    $set:{coverImage:coverImage.url}  
  },{new:true}).select("-password")
  return res
.status(200)
.json(
  new ApiResponse(200,user,"cover image successfully")
)
})
const getUserChannelProfile= asyncHandler(async(req,res)=>{
const{username} = req.params
if(!username?.trim()){
  throw new ApiError(400,"username is missing")
}
 const channel =await User.aggregate([{
  $match:{
    username:username?.toLowerCase()

  }
 },{
  $lookup:{
    from:"subscriptions",
    localField:"_id",
    foreignField:"channel",
    as:"subscribers"
  }
 },
 {
  $lookup:{
    from:"subscriptions",
    localField:"_id",
    foreignField:"subscriber",
    as:"subscribedTo"
  }
 },{
  $addFields:{
    subscribersCount:{
      $size:"$subscribers"
    },
    channelsSubscribedTocount:{
      $size:"$subscribedTo"
    },
    isSubscribed:{
      $cond:{
        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
        then:true,
        else:false
      }
    }
  }
 },
 {
  $project:{
    fullName:1,
    username:1,
    subscribersCount:1,
    channelsSubscribedTocount:1,
    isSubscribed:1,
    avatar:1,
    coverImage:1,
    email:1

  }
 }
])
if(!channel?.length){
  throw new ApiError(404,"channel does not exists")
}
return res.status(200).json(new ApiResponse(200,channel[0],"user channel fetched successfully"))

})
const getWatchHistory= asyncHandler(async(req,res)=>{
const user = await User.aggregate([{
  $match:{
   _id:new mongoose.Types.ObjectId(req.user._id)
  }
},{
$lookup:{
  from:"videos",
  localField:"watchHistory",
  foreignField:"_id",
  as:"watchHistory",
  pipeline:[
    {
      $lookup:{
        from:"users",
        localField:"owner",
        foreignField:"_id",
        as:"owner",
        pipeline:[
          {
            $project:{
              fullName:1,
              username:1,
              avatar:1

            }
          }
        ]
      }
    },
    {
      $addFields:{
        owner:{
          $first:"$owner"
        }
      }
    }
  ]
}
}
])
return 
res.status(200)
.json(new ApiResponse(200,user[0].getWatchHistory,"watchHistory fetched successfully"))
})

export { registerUser, loginUser,logoutUser,refreshAccessToken,changesCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory };
