import {v2 as cloudinary} from "cloudinary"
import { response } from "express";
import fs from "fs"


cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloud = async (localFilePath) => {
    try {
        console.log(localFilePath)
        if (!localFilePath) return null

        //Upload to Cloud
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:'auto'
        })

        fs.unlinkSync(localFilePath)
        console.log(response)
        return response;
    }
    catch(error) {
        console.log(error)
        fs.unlinkSync(localFilePath) //remove the locally saved temporary file
        return null
    }
}

export {uploadOnCloud}