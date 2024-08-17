import { generateAccessToken, generateRefreshToken } from '../middlewares/jwt.js'
import { UserModel } from '../models/UserModel.js'
import jwt from 'jsonwebtoken'
import sendMail from '../ultils/sendMail.js'
import crypto from 'crypto'
import sharp from 'sharp';

export const register = async (req, res) => {
    const { email, password, firstname, lastname, mobile } = req.body
    if (!email || !password || !firstname || !lastname || !mobile) {
        return res.status(400).json({
            success: false,
            mess: "All field are required"
        })
    }
    try {
        const user = await UserModel.findOne({ $or: [{ email }, { mobile }] })
        if (user) {
            const mess = user.email === email ? "Email is used" : "Mobile is used"
            return res.status(400).json({
                success: false,
                mess
            })
        }
        const newUser = await UserModel.create(req.body)
        return res.status(200).json({
            success: !!newUser,
            mess: newUser ? 'Register is successful' : 'Registration failed'
        })
    } catch (error) {
        return res.status(500).json({ success: false, mess: error.message });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            mess: 'All field are required'
        });
    }

    try {
        const response = await UserModel.findOne({ email });
        if (response && await response.isCorrectPassword(password)) {
            const { password, role, ...userData } = response.toObject();
            const accessToken = generateAccessToken(response._id, role);
            const refreshToken = generateRefreshToken(response._id);
            await UserModel.findByIdAndUpdate(response._id, { refreshToken }, { new: true });

            res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.status(200).json({
                success: true,
                accessToken,
                userData
            });
        } else {
            return res.status(401).json({
                success: false,
                mess: 'Invalid password or username'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};

export const getCurrent = async (req, res) => {
    const { _id } = req.user
    try {
        const user = await UserModel.findOne({ _id }).select('-refreshToken -password -role')
        return res.status(200).json({
            success: !!user,
            rs: user ? user : 'User not found'
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        })
    }
}

export const refreshAccessToken = async (req, res) => {
    try {
        const cookie = req.cookies;

        if (!cookie || !cookie.refreshToken) {
            throw new Error('No refreshToken in cookie');
        }

        const decodedToken = jwt.verify(cookie.refreshToken, process.env.JWT_TOKEN);
        const response = await UserModel.findOne({ _id: decodedToken._id, refreshToken: cookie.refreshToken });

        if (response) {
            const newAccessToken = generateAccessToken(response._id, response.role);
            return res.status(200).json({
                success: true,
                newAccessToken
            });
        } else {
            return res.status(400).json({
                success: false,
                newAccessToken: 'Refresh token not matched'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};
export const logout = async (req, res) => {
    try {
        const cookie = req.cookies;

        if (!cookie || !cookie.refreshToken) {
            throw new Error('No refreshToken');
        }

        await UserModel.findOneAndUpdate({ refreshToken: cookie.refreshToken }, { refreshToken: '' }, { new: true });
        res.clearCookie('refreshToken', { httpOnly: true, secure: true });

        return res.status(200).json({
            success: true,
            mess: 'Logout successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            throw new Error('Missing Email');
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            throw new Error('User not found');
        }

        const resetToken = user.createPasswordChangedToken();
        await user.save();

        const html = `Xin vui lòng click vào link dưới đây để thay đổi mật khẩu của bạn. Link này sẽ hết hạn sau 15 phút kể từ bây giờ. <a href=${process.env.URL_SERVER}/api/user/reset-password/${resetToken}>Click here</a>`;

        const data = {
            email,
            html
        };

        const rs = await sendMail(data);

        return res.status(200).json({
            success: true,
            rs
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};
export const resetPassword = async (req, res) => {
    try {
        const { password, token } = req.body;

        if (!password || !token) {
            throw new Error('Missing Password or Token');
        }

        const passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await UserModel.findOne({ passwordResetToken, passwordResetExpires: { $gt: Date.now() } });

        if (!user) {
            throw new Error('Invalid reset token');
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordChangeAt = Date.now();
        user.passwordResetExpires = undefined;
        await user.save();

        return res.status(200).json({
            success: true,
            mess: 'Updated password'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const response = await UserModel.find().select('-refreshToken -password -role')
        if (response) return res.status(200).json({
            success: true,
            users: response
        })
        else return res.status(400).json({
            success: false,
            mess: "Can't get all user"
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        })
    }
}
export const deleteUsers = async (req, res) => {
    try {
        const { _id } = req.query;

        if (!_id) {
            throw new Error('Missing inputs');
        }

        const response = await UserModel.findByIdAndDelete(_id);

        return res.status(200).json({
            success: !!response,
            deleteUser: response ? `User with email ${response.email} deleted` : 'No user deleted'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { _id } = req.user;

        if (!_id || Object.keys(req.body).length === 0) {
            throw new Error('Missing inputs');
        }

        const response = await UserModel.findByIdAndUpdate(_id, req.body, { new: true }).select('-refreshToken -password -role');

        return res.status(200).json({
            success: !!response,
            updatedUser: response ? response : 'Wrong'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};
export const updateUserByAdmin = async (req, res) => {
    try {
        const { uid } = req.params;

        if (Object.keys(req.body).length === 0) {
            throw new Error('Missing inputs');
        }

        const response = await UserModel.findByIdAndUpdate(uid, req.body, { new: true }).select('-refreshToken -password -role');

        return res.status(200).json({
            success: !!response,
            updatedUser: response ? response : 'Wrong'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            mess: error.message
        });
    }
};
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded!' });
        }

        const buffer = await sharp(req.file.path)
            .png()
            .toBuffer();

        const { _id } = req.user
        const user = await UserModel.findOneAndUpdate(
            { _id: _id }, // Điều kiện tìm kiếm người dùng
            { avatar: { data: buffer, contentType: 'image/png' } }, // Cập nhật trường avatar với buffer của ảnh
            { new: true } // Trả về tài liệu đã được cập nhật
        ).select('-refreshToken -password -role');

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({
            success: true,
            mess: error.message
        });
    }
}