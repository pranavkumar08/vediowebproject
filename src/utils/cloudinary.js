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
        
        // Check if file exists before trying to upload
        if (!fs.existsSync(localfilepath)) {
            console.log("File does not exist:", localfilepath);
            return null;
        }
        
        const response=await cloudinary.uploader.upload(localfilepath,{
            resource_type:'auto',
        })
        console.log(response, "response")
        // //file has been uploaded 
        console.log("file uploaded successfully on cloudinary",response.url);
        
        // Remove file only if it exists
        if (fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath)
        }
        return response
    } catch (error) {
        console.log(error, "ERROR")
        // Remove file only if it exists
        if (localfilepath && fs.existsSync(localfilepath)) {
            try {
                fs.unlinkSync(localfilepath);//remove the file from local server if uploaded on cloudinary
            } catch (unlinkError) {
                console.log("Error deleting file:", unlinkError);
            }
        }
        return null
    }
}


export {uploadOnCloudianry};