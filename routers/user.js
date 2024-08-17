import express from 'express'
import { deleteUsers, forgotPassword, getCurrent, getUsers, login, logout, refreshAccessToken, register, resetPassword, updateUser, updateUserByAdmin, uploadAvatar } from '../controller/user.js'
import { verifyAccessToken, isAdmin } from '../middlewares/verifyToken.js'
import multer from 'multer';

const UserRouter = express.Router()
const upload = multer({ dest: 'upload/' });

UserRouter.post('/register', register)
UserRouter.post('/login', login)
UserRouter.get('/current', verifyAccessToken, getCurrent)
UserRouter.post('/refreshToken', refreshAccessToken)
UserRouter.get('/forgotpassword', forgotPassword)
UserRouter.get('/logout', logout)
UserRouter.put('/reset-password', resetPassword)
UserRouter.get('/', [verifyAccessToken, isAdmin], getUsers)
UserRouter.delete('/', [verifyAccessToken, isAdmin], deleteUsers)
UserRouter.put('/current', verifyAccessToken, updateUser)
UserRouter.put('/avatar', upload.single("file"), verifyAccessToken, uploadAvatar)

UserRouter.put('/:uid', [verifyAccessToken, isAdmin], updateUserByAdmin)
export default UserRouter