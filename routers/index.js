import { notFound, errorHandler } from "../middlewares/errorHandler.js";
import CommentRouter from "./comment.js";
import PostRouter from "./posts.js";
import UserRouter from "./user.js";

export const initRoutes = (app) => {
    app.use('/api/user', UserRouter)
    app.use('/api/post', PostRouter)
    app.use('/api/comment', CommentRouter)

    app.use(notFound)
    app.use(errorHandler)
}