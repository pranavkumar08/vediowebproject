import dotenv from 'dotenv';
import  connectdb from './db/database.js';
dotenv.config(
    {
        path:'./.env'
    }
);
connectdb().then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`server is running on port ${process.env.PORT||8000}`); 
    })
})
.catch((err)=>{
    console.log("mongodb connection error!!!",err);
    
});