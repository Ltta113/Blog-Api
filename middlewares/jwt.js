import jwt from 'jsonwebtoken'

export const generateAccessToken = (uid, role) => jwt.sign({_id:uid, role}, process.env.JWT_TOKEN, { expiresIn : '1d'})
export const generateRefreshToken = (uid) => jwt.sign({_id:uid}, process.env.JWT_TOKEN, { expiresIn : '7d'})
