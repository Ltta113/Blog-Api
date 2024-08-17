import jwt from 'jsonwebtoken'
import expressAsyncHandler from 'express-async-handler'

export const verifyAccessToken = expressAsyncHandler(async (req, res, next) => {
    if (req?.headers?.authorization?.startsWith('Bearer')) {
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token, process.env.JWT_TOKEN, (err, decode) => {
            if (err) return res.status(401).json({
                success: false,
                mes: 'Invalid access token'
            })
            req.user = decode
            next()
        })
    } else {
        return res.status(401).json({
            success: false,
            mess: 'Require authenication!!!'
        })
    }
})
export const isAdmin = expressAsyncHandler((req, res, next) => {
    const { role } = req.user
    if (role !== 'admin')
        return res.status(401).json({
            success: false,
            mess: "Require admin role"
        })
    next()
})