import mongoose,{Schema} from "mongoose";

const videoSchema = new Schema(
    {
        videoFile : {
            type:String,
            required:true
        },
        thumbnail: {
            type:String,
            required:true
        },
        title : {
            type : String,
            required:true
        }, 
        description : {
            type : string,
            required: true
        },
        duration : {
            type: Number,
            required:true
        },
        views : {
            type:Number,
            default:0
        }, 
        isPublished :{
            type: Boolean,
            default:true
        }, 
        owner : {
            type: Schema.Types.ObjectId,
            ref : 'User'
        }
    },
    {
        timestamps:true
    }
)


//Process and crypt pwd only when we call it just before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next() ;

    this.password = bcrypt.hash(this.password,10)
    next()
})



userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}


userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const Video = mongoose.model("Video", videoSchema)