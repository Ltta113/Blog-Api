import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { type } from "os";

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    avatar: {
        contentType: String,
        data: Buffer
    },
    role: {
        type: String,
        default: 'user',
    },
    address: [{ type: mongoose.Types.ObjectId, ref: 'Address' }],
    reactions: [
        {
            post: { type: mongoose.Types.ObjectId, ref: 'Post' },
            type: { type: String, enum: ['like', 'dislike', 'love', /* Thêm các loại phản hồi khác vào đây */] }
        }
    ],
    isBlocked: {
        type: Boolean,
        default: false
    },
    refreshToken: {
        type: String,
    },
    passwordChangeAt: {
        type: String,
    },
    passwordResetToken: {
        type: String,
    },
    passwordResetExpires: {
        type: String,
    }
}, { timestamps: true })

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next()
    }
    const salt = bcrypt.genSaltSync(10)
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods = {
    isCorrectPassword: async function (password) {
        return await bcrypt.compare(password, this.password)
    },
    createPasswordChangedToken: function () {
        const resetToken = crypto.randomBytes(32).toString('hex')
        this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
        this.passwordResetExpires = Date.now() + 15 * 60 * 1000
        return resetToken
    }
}

export const UserModel = mongoose.model('User', userSchema)