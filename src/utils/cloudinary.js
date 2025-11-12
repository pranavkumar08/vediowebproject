import {v2 as cloudinary} from 'cloudinary';
cloudinary.config({
cloud_name:process.env.CLOUD_NAME,
api_key:process.env.API_KEY,
api_secret:process.env.API_SECRET
})

const uploadOnCloudianry= async(localfilepath)=>{
    try {
        if(!localfilepath) return null
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:'auto',
        })
        //file has been uploaded 
        console.log("file uploaded successfully on cloudinary",response.url);
        return response
    } catch (error) {
        fs.unlinlnkSync(localfilepath)//remove the file from local server if uploaded on cloudinary
        return null
    }
}


export {uploadOnCloudianry};