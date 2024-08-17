import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
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
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }, // Tham chiếu đến comment cha (nếu có)
    replies: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ]
});

export const CommentModel = mongoose.model('Comment', commentSchema);