import { CommentModel } from "../models/CommentModel.js";
import { PostModel } from "../models/PostModel.js"
import { UserModel } from "../models/UserModel.js"
import mongoose from 'mongoose';

export const createPost = async (req, res) => {
    try {
        const { _id } = req.user
        const { title, content } = req.body

        if (!title || !content) return res.status(400).json({
            success: false,
            mess: "Missing Inputs"
        })
        req.body.author = new mongoose.Types.ObjectId(_id);

        const newPost = await PostModel.create(req.body)
        if (newPost) return res.status(200).json({
            success: true,
            mess: "Create successfully"
        })
        else return res.status(400).json({
            success: false,
            mess: "Create is failed"
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        })
    }
}
export const getPosts = async (req, res) => {
    try {
        // Basic filtering
        const queryObj = { ...req.query };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // Advanced filtering
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        let formatQueries = JSON.parse(queryString);

        // Title filtering
        if (queryObj.title) {
            formatQueries.title = { $regex: queryObj.title, $options: 'i' };
        }

        // Build the query
        let query = PostModel.find({ ...formatQueries, published: true });

        const totalPosts = await query.clone().countDocuments();

        // Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt');
        }

        // Field limiting
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        } else {
            query = query.select('-__v');
        }

        // Pagination
        const page = +req.query.page || 1;
        const limit = +req.query.limit || process.env.LIMIT_POSTS;
        const skip = (page - 1) * limit;

        query = query.skip(skip).limit(limit).populate({
            path: 'author',
            select: 'firstname lastname'
        })

        // Execute the query
        let posts = await query;

        if (posts.length > 0) {
            // Modify the author field to contain the full name
            posts = posts.map((post) => ({
                ...post._doc,
                author: `${post.author.firstname} ${post.author.lastname}`,
            }));

            res.status(200).json({
                success: true,
                results: totalPosts,
                posts,
            });
        } else {
            res.status(404).json({
                success: false,
                mess: 'Không tìm thấy bài viết nào',
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message,
        });
    }
};
export const getPostById = async (req, res) => {
    try {
        const { postid } = req.params;

        // Kiểm tra postid hợp lệ
        if (!mongoose.Types.ObjectId.isValid(postid)) {
            return res.status(400).json({
                success: false,
                mess: "ID bài viết không hợp lệ"
            });
        }

        const posts = await PostModel.findOne({ _id: postid, published: true })
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
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'firstname lastname'
                },
                match: { parentComment: null },
                select: '_id content author reactions reactionCounts replies'
            })
            .select('title content createdAt updatedAt images reactionCounts reactions')
            .lean();

        // Kiểm tra kết quả trả về
        if (posts) {
            res.status(200).json({
                success: true,
                posts
            });
        } else {
            res.status(404).json({
                success: false,
                mess: "Không tìm thấy bài viết nào cho ID này hoặc bài viết chưa được xuất bản"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};
// export const getPostByIdUser = async (req, res) => {
//     try {
//         const { postid } = req.params;
//         const { _id } = req.user;
//         // Kiểm tra postid hợp lệ
//         if (!mongoose.Types.ObjectId.isValid(postid)) {
//             return res.status(400).json({
//                 success: false,
//                 mess: "ID bài viết không hợp lệ"
//             });
//         }

//         const posts = await PostModel.aggregate([
//             {
//                 $match:
//                     { author: new mongoose.Types.ObjectId(_id), _id: new mongoose.Types.ObjectId(postid) }
//             },
//             {
//                 $project: {
//                     title: 1,
//                     content: 1,
//                     createdAt: 1,
//                     updatedAt: 1,
//                     images: 1,
//                     totalLiked: 1,
//                 }
//             }
//         ]);

//         // Kiểm tra kết quả trả về
//         if (Array.isArray(posts) && posts.length > 0) {
//             res.status(200).json({
//                 success: true,
//                 posts
//             });
//         } else {
//             res.status(404).json({
//                 success: false,
//                 mess: "Không tìm thấy bài viết nào cho ID này hoặc bài viết chưa được xuất bản"
//             });
//         }
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             mess: error.message
//         });
//     }
// };

export const getPostsByUser = async (req, res) => {
    try {
        const { _id } = req.user;

        const posts = await PostModel.find({ author: _id })
            .select('title content createdAt updatedAt images reactions reactionCounts published')

        if (posts.length > 0) {
            res.status(200).json({
                success: true,
                posts
            });
        } else {
            res.status(404).json({
                success: false,
                mess: "Không tìm thấy bài viết nào cho người dùng này"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};


export const updatePost = async (req, res) => {
    try {
        const { _id } = req.user
        const { postid } = req.params
        if (Object.keys(req.body).length === 0) {
            throw new Error('Missing inputs');
        }
        const response = await PostModel.findOneAndUpdate(
            { _id: postid, author: _id },
            req.body,
            { new: true }
        );
        if (response) return res.status(200).json({
            success: true,
            post: response
        });
        else return res.status(400).json({
            success: false,
            mess: "Update is failed"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            mess: error.message
        })
    }
}
export const deletePost = async (req, res) => {
    try {
        const { _id, role } = req.user;
        const { postid } = req.query;

        // Kiểm tra nếu postid là hợp lệ
        if (!mongoose.Types.ObjectId.isValid(postid)) {
            return res.status(400).json({
                success: false,
                mess: "ID bài viết không hợp lệ"
            });
        }

        // Kiểm tra vai trò của người dùng
        const user = await UserModel.findById(_id);
        if (!user) {
            return res.status(404).json({
                success: false,
                mess: "Người dùng không tồn tại"
            });
        }

        const postId = new mongoose.Types.ObjectId(postid)
        let response;
        if (role === 'admin') {
            // Người dùng là admin, xóa bài viết với postid
            response = await PostModel.deleteOne({ _id: postId });
        } else {
            // Người dùng là user, xóa bài viết với _id và postid
            response = await PostModel.deleteOne({ _id: postId, author: new mongoose.Types.ObjectId(_id) });
        }
        await CommentModel.deleteMany({ post: postId });
        if (response.deletedCount > 0) {
            return res.status(200).json({
                success: true,
                deletePost: "Post is deleted"
            });
        } else {
            return res.status(400).json({
                success: false,
                mess: "Delete is failed"
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};

export const reactionPost = async (req, res) => {
    try {
        const { _id } = req.user;
        const { postid, reactionType } = req.body;
        if (!postid || !reactionType) throw new Error("Missing Input");

        const likedPost = await PostModel.findById(postid);
        if (!likedPost) throw new Error("Post not found");

        const existingReactionIndex = likedPost.reactions.findIndex(reaction => reaction.user.equals(_id));
        const user = await UserModel.findById(_id)

        if (existingReactionIndex !== -1) {
            // Nếu đã có phản hồi
            if (likedPost.reactions[existingReactionIndex].type === reactionType) {
                // Nếu phản hồi cùng loại, loại bỏ phản hồi (unreact)
                likedPost.reactions.splice(existingReactionIndex, 1);
                user.reactions = user.reactions.filter(r => !(r.post.equals(postid) && r.type === reactionType));
            } else {
                // Nếu phản hồi khác loại, cập nhật loại phản hồi
                likedPost.reactions[existingReactionIndex].type = reactionType;
                const userReaction = user.reactions.find(r => r.post.equals(postid));
                if (userReaction) userReaction.type = reactionType;
            }
        } else {
            // Nếu chưa có phản hồi, thêm phản hồi mới
            likedPost.reactions.push({ user: _id, type: reactionType });
            user.reactions.push({ post: postid, type: reactionType });
        }
        console.log(user)

        // Tính lại reactionCounts dựa trên các phản hồi hiện tại
        likedPost.reactionCounts = {
            likes: likedPost.reactions.filter(reaction => reaction.type === 'like').length,
            dislikes: likedPost.reactions.filter(reaction => reaction.type === 'dislike').length,
            loves: likedPost.reactions.filter(reaction => reaction.type === 'love').length,
            // Thêm các trường xử lý cho các loại phản hồi khác vào đây nếu cần
        };

        await likedPost.save();
        await user.save();

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
}
export const uploadImagePost = async (req, res) => {
    try {
        const { postid } = req.params;
        if (!req.files) {
            throw new Error("Missing Input");
        }

        const response = await PostModel.findByIdAndUpdate(
            postid,
            { $push: { images: { $each: req.files.map(el => el.path) } } },
            { new: true } // Option to return the updated document
        );

        return res.status(response ? 200 : 404).json({
            success: !!response,
            mess: response ? response : 'Not found',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message,
        });
    }
};

