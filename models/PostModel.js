import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    author: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    images: {
        type: Array
    },
    reactions: [
        {
            user: { type: mongoose.Types.ObjectId, ref: 'User' },
            type: { type: String, enum: ['like', 'dislike', 'love', /* Thêm các loại phản hồi khác vào đây */] }
        }
    ],
    // Thuộc tính để tính số lượng từng loại hành động phản hồi
    reactionCounts: {
        likes: { type: Number, default: 0 }, // Số lượng like
        dislikes: { type: Number, default: 0 }, // Số lượng dislike
        loves: { type: Number, default: 0 }, // Số lượng love
        // Thêm các trường đếm số lượng hành động phản hồi khác vào đây nếu cần
    },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    published: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

export const PostModel = mongoose.model('Post', postSchema)