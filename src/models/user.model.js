import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; 

const userSchema= new Schema({
username:{
    type:String,
    required:true,
    unique:true,
    trim:true,
    index:true
},
email:{
type:String,
required:true,
unique:true,
lowercase:true,
trim:true

},
fullName:{
    type:String,
    required:true,
    trim:true,
    index:true
},
avatar:{
    type:String,
    required:true
},
coverimage:{
    type:String
},
watchhistory:[{
    type:Schema.Types.ObjectId,
    ref:"video"
}],

password:{
    type:String,
    required:[true,"password is required"] 
},
refreshTokens:{
    type:String
}

},{timestamps:true}
)
userSchema.pre("save",async function(next){
    if(!this.isModified("password")){
     return next();
    }
    this.password=await bcrypt.hash(this.password,10)
    next()   
})
userSchema.methods.isPasswordcorrect= async function (password) {
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.generateAccessToken=function(){
return jwt.sign({
    _id:this._id,
    email:this.email,
    username:this.username,
    fullname:this.fullname

},
"uygferyf",
{
    expiresIn:"1d"
})
}
userSchema.methods.genderateRefreshToken=function(){
return jwt.sign({
    _id:this._id,
    

},
"uhyyvbuy",
{
    expiresIn:"1d"
})
}

export const User = mongoose.model("User",userSchema)