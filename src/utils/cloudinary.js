import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'; 
cloudinary.config({
cloud_name:"pranav-cloud-process",
api_key:"483664377393297",
api_secret:"rHt_ko4fJcYAU3ZJz-m4fTByqIo"
})

const uploadOnCloudianry= async(localfilepath)=>{
    try {
        console.log(localfilepath, "local file path")
        if(!localfilepath) return null
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:'auto',
        })
        console.log(response, "response")
        // //file has been uploaded 
        console.log("file uploaded successfully on cloudinary",response.url);
        fs.unlinkSync(localfilepath)
        return response
    } catch (error) {
        console.log(error, "ERROR")
        fs.unlinkSync(localfilepath)//remove the file from local server if uploaded on cloudinary
        return null
    }
}


export {uploadOnCloudianry};