import express from 'express'
import { getPosts, createPost, updatePost, deletePost, getPostsByUser, getPostById, reactionPost, uploadImagePost } from '../controller/posts.js'
import { verifyAccessToken } from '../middlewares/verifyToken.js'
import uploadCloud from '../config/cloudinary.config.js'

const PostRouter = express.Router()

PostRouter.get('/', getPosts)
PostRouter.post('/', verifyAccessToken, createPost)
PostRouter.delete('/', verifyAccessToken, deletePost)
PostRouter.put('/like', verifyAccessToken, reactionPost)
PostRouter.get('/getCurrentPosts', verifyAccessToken, getPostsByUser)
PostRouter.get('/getPost/:postid', getPostById)
PostRouter.put('/uploadImage/:postid', verifyAccessToken, uploadCloud.array('images', 10), uploadImagePost)

//PostRouter.get('/getPostUser/:postid', verifyAccessToken, getPostByIdUser)
PostRouter.put('/update/:postid', verifyAccessToken, updatePost)
export default PostRouter