import { CommentModel } from "../models/CommentModel.js";
import mongoose from "mongoose";
import { PostModel } from "../models/PostModel.js";
import { response } from "express";

export const createComment = async (req, res) => {
    try {
        const { content, postid, commentid } = req.body;
        const userId = req.user._id;

        // Kiểm tra xem người dùng có tồn tại không
        // Code kiểm tra người dùng ở đây

        // Kiểm tra xem các trường đầu vào bắt buộc đã được cung cấp không
        if (!content || !postid) {
            return res.status(400).json({
                success: false,
                mess: 'Missing required fields'
            });
        }

        // Kiểm tra xem bài đăng có tồn tại không
        const post = await PostModel.findById(postid);
        if (!post) {
            return res.status(404).json({
                success: false,
                mess: 'Post not found'
            });
        }

        let newComment;
        if (commentid) {
            // Nếu có commentid, tạo một bình luận mới với parentComment là commentid
            const parentComment = await CommentModel.findOne({ _id: commentid, post: postid });
            if (!parentComment) {
                return res.status(404).json({
                    success: false,
                    mess: 'Parent comment not found'
                });
            }

            newComment = await CommentModel.create({
                content,
                author: userId,
                post: postid,
                parentComment: commentid
            });
            parentComment.replies.push(newComment._id);
            await parentComment.save();
        } else {
            // Nếu không có commentid, tạo một bình luận mới không có parentComment
            newComment = await CommentModel.create({
                content,
                author: userId,
                post: postid
            });
        }
        post.comments.push(newComment._id)
        await post.save()
        return res.status(200).json({
            success: true,
            mess: "Comment successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};

export const getCommentWithPost = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!postId) throw new Error("Missing postId");

        // Lọc cơ bản
        const comments = await CommentModel.find({ post: postId, parentComment: null })
            .sort({ createdAt: -1 })
            .populate({
                path: 'author',
                select: 'firstname lastname'
            })
            .populate({
                path: 'reactions',
                populate: {
                    path: 'user',
                    select: 'firstname lastname'
                },
                select: '_id type'
            })
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'firstname lastname '
                },
                select: '_id content author reactions reactionCounts replies'
            })
            .select('_id content author reactions reactionCounts replies')
            .lean();

        const totalComments = comments.length;
        res.status(200).json({
            success: true,
            results: totalComments,
            comments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
}
export const reactionComment = async (req, res) => {
    try {
        const { _id } = req.user;
        const { commentid, reactionType } = req.body;
        if (!commentid || !reactionType) throw new Error("Missing Input");

        const reactionComment = await CommentModel.findById(commentid);
        if (!reactionComment) throw new Error("Comment not found");

        const existingReactionIndex = reactionComment.reactions.findIndex(reaction => reaction.user.equals(_id));

        if (existingReactionIndex !== -1) {
            // Nếu đã có phản hồi
            if (reactionComment.reactions[existingReactionIndex].type === reactionType) {
                // Nếu phản hồi cùng loại, loại bỏ phản hồi (unreact)
                reactionComment.reactions.splice(existingReactionIndex, 1);
            } else {
                // Nếu phản hồi khác loại, cập nhật loại phản hồi
                reactionComment.reactions[existingReactionIndex].type = reactionType;
            }
        } else {
            // Nếu chưa có phản hồi, thêm phản hồi mới
            reactionComment.reactions.push({ user: _id, type: reactionType });
        }

        // Tính lại reactionCounts dựa trên các phản hồi hiện tại
        reactionComment.reactionCounts = {
            likes: reactionComment.reactions.filter(reaction => reaction.type === 'like').length,
            dislikes: reactionComment.reactions.filter(reaction => reaction.type === 'dislike').length,
            loves: reactionComment.reactions.filter(reaction => reaction.type === 'love').length,
            // Thêm các trường xử lý cho các loại phản hồi khác vào đây nếu cần
        };

        await reactionComment.save();

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
}
export const deleteComment = async (req, res) => {
    try {
        const { _id, role } = req.user
        const { commentid } = req.query
        if (!mongoose.isValidObjectId(commentid)) {
            return res.status(400).json({
                success: false,
                mess: "ID comment không hợp lệ"
            });
        }
        const commentObjectId = new mongoose.Types.ObjectId(commentid);
        let response;

        if (role === 'admin') {
            // Admin có thể xóa bất kỳ comment nào
            response = await CommentModel.deleteOne({ _id: commentObjectId });
        } else {
            // Người dùng thường chỉ có thể xóa comment của họ
            response = await CommentModel.deleteOne({ _id: commentObjectId, author: _id });
        }

        // Xóa tất cả các comment con
        await CommentModel.deleteMany({ parentComment: commentObjectId });
        if (response.deletedCount > 0) {
            return res.status(200).json({
                success: true,
                deleteComment: "Comment is deleted"
            });
        } else {
            return res.status(400).json({
                success: false,
                mess: "Delete is failed"
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            mess: error.message
        });
    }
}
export const updateComment = async (req, res) => {
    try {
        const { _id } = req.user
        const { commentid } = req.params
        if (Object.keys(req.body).length === 0) {
            throw new Error('Missing inputs');
        }
        const response = await CommentModel.findOneAndUpdate(
            { _id: commentid, author: _id },
            req.body,
            { new: true }
        )
        if (response) return res.status(200).json({
            success: true,
            comment: response
        })
        else return res.status(400).json({
            success: false,
            mess: "Update is failed"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        })
    }
}
