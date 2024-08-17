import express from 'express'
import { verifyAccessToken } from '../middlewares/verifyToken.js'
import { createComment, deleteComment, getCommentWithPost, reactionComment, updateComment } from '../controller/comment.js'

const CommentRouter = express.Router()

CommentRouter.post('/', verifyAccessToken, createComment)
CommentRouter.put('/reaction', verifyAccessToken, reactionComment)
CommentRouter.delete('/', verifyAccessToken, deleteComment)
CommentRouter.put('/update/:commentid', verifyAccessToken, updateComment)
CommentRouter.get('/:postId', getCommentWithPost)

export default CommentRouter