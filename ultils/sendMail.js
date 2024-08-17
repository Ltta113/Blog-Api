import nodemailer from 'nodemailer';
import asyncHandler from 'express-async-handler';

const sendMail = asyncHandler(async ({ email, html }) => {
    const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_NAME, // generated ethereal user
            pass: process.env.EMAIL_APP_PASSWORD, // generated ethereal password
        },
    });

    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"postforlife" <no-relply@postforlife.com>', // sender address
        to: email, // list of receivers
        subject: "Forgot Password", // Subject line
        html, // html body
    });

    return info;
});

export default sendMail;