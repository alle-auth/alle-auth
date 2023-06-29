import { ForgotPasswordRequestBody, GetProfileRequestBody, ResetPasswordRequestBody, SignInRequestBody, SignOutRequestBody, SignUpRequestBody, UpdateProfileRequestBody, VerifyOtpRequestBody } from "../interfaces/auth.interface"
import { Request, Response, NextFunction } from "express"
require("dotenv").config()
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')
const generateUniqueId = require('../utils/uidGenerator')
const Cryptr = require('cryptr')
const { getEnvironment } = require("../config/environment")
const generateOtp = require("../utils/otpGenerator")
const cryptr = new Cryptr(getEnvironment().CRYPTR_SECRET)
const { Resend } = require("resend")
const resend = new Resend(process.env.RESEND_API_KEY)

export const signup = async (
    req: Request<{}, {}, SignUpRequestBody>,
    res: Response,
    next: NextFunction
): Promise<Response> => {
    try {
        const {
            email, password, name, role
        } = req.body;
        if (!email || !password || !name || !role) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Please provide all the required fields",
                data: null
            })
        }
        const hash = cryptr.encrypt(password)
        if (!hash) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Password not hashed",
                data: null
            })
        }
        const newUser = await User.create({
            name,
            email,
            role,
            password: hash,
            userId: `u` + generateUniqueId()
        })
        if (!newUser) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "User not created!",
                data: null
            })
        }
        return res.status(200).send({
            status: true,
            error: false,
            message: "User created successfully",
            data: newUser
        })
    }
    catch (err: any) {
        console.log(err)
        if (err.code === 11000) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "User already exists with this email",
                data: null
            })
        }
        return res.status(500).send({
            status: false,
            error: true,
            message: err.message,
            data: null
        })
    }
}

export const signin = async (
    req: Request<{}, {}, SignInRequestBody>,
    res: Response,
    next: NextFunction) => {
    try {
        let { email, password } = req.body
        if (!email || !password) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Please provide all the required fields",
                data: null
            })
        }
        const data = await User.findUserByCredentials(email, password)
        if (!data.status) {
            return res.status(400).send({
                status: false,
                message: data.message,
                data: null
            })
        }
        const token = jwt.sign(
            { _id: data.data._id },
            getEnvironment().JSON_SECRET,
            { expiresIn: '7d' },
        );
        if (!token) {
            return res.status(400).send({
                status: false,
                message: "Token not generated",
                data: null
            })
        }
        const user = await User.findByIdAndUpdate(data.data._id, { token }, { new: true })
        if (!user) {
            return res.status(400).send({
                status: false,
                message: "User not found",
                data: null
            })
        }
        return res.status(200).send({
            status: true,
            message: "User logged in successfully",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                token: user.token,
                userId: user.userId,
                role: user.role
            }
        })
    }
    catch (err: any) {
        console.log(err)
        return res.status(500).send({
            status: false,
            message: err.message,
            data: null
        })
    }
}

export const signout = async (
    req: Request<{}, {}, SignOutRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {
        const { token } = req.body
        if (!token) {
            return res.status(400).send({
                status: false,
                message: "Please provide the token",
                data: null
            })
        }
        const user = await User.findOne({ token })
        if (!user) {
            return res.status(400).send({
                status: false,
                message: "User not found",
                data: null
            })
        }
        const updatedUser = await User.findByIdAndUpdate(user._id, { token: null }, { new: true })
        if (!updatedUser) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "User not found",
                data: null
            })
        }
        return res.status(200).send({
            status: true,
            message: "User signed out successfully",
            data: null
        })
    }
    catch (err: any) {
        console.log(err)
        return res.status(500).send({
            status: false,
            message: err.message,
            data: null
        })
    }
}

export const getProfile = async (
    req: Request<{}, {}, GetProfileRequestBody>,
    res: Response,
    next: NextFunction) => {
    try {
        const { token } = req.body
        if (!token) {
            return res.status(400).send({
                status: false,
                message: "Please provide the token",
                data: null
            })
        }
        const user = await User.findOne({
            token
        })
        if (!user) {
            return res.status(400).send({
                status: false,
                message: "User not found",
                data: null
            })
        }
        return res.status(200).send({
            status: true,
            message: "User profile fetched successfully",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        })
    }
    catch (err: any) {
        return res.status(500).send({
            status: false,
            message: err.message,
            data: null
        })
    }
}

export const forgotPassword = async (
    req: Request<{}, {}, ForgotPasswordRequestBody>,
    res: Response,
    next: NextFunction
) => {
    try {
        // find user by email
        const { email } = req.body
        if (!email) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Please provide email",
                data: null
            })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "User not found",
                data: null
            })
        }

        // generate otp
        const otp = generateOtp()
        // add otp to user profile
        user.otp = otp
        user.save()

        // send otp to email
        const mailData = {
            from: "onboarding@resend.dev",
            to: email,
            subject: `OTP for password reset`,
            html: `<h1>OTP for password reset is ${otp}</h1>`
        }
        resend.domains
        const emailRes = await resend.sendEmail(mailData)
        if (emailRes.id) {
            return res.status(200).send({
                status: true,
                error: false,
                message: "OTP sent successfully",
                data: null
            })
        }
    }
    catch (err: any) {
        console.log(err)
        return res.status(500).send({
            status: false,
            error: true,
            message: err.message,
            data: null
        })
    }
}

export const verifyOtp = async (
    req: Request<{}, {}, VerifyOtpRequestBody>,
    res: Response,
    next: NextFunction) => {
    try {
        const { email, otp, } = req.body
        if (!email || !otp) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Please provide email and otp",
                data: null
            })
        }
        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "User not found",
                data: null
            })
        }
        if (user.otp !== otp) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Invalid OTP",
                data: null
            })
        }
        return res.status(200).send({
            status: true,
            error: false,
            message: "OTP verified successfully",
            data: null
        })
    }
    catch (err: any) {
        console.log(err)
        return res.status(500).send({
            status: false,
            error: true,
            message: err.message,
            data: null
        })
    }
}

export const resetPassword = async (req: Request<{}, {}, ResetPasswordRequestBody>, res: Response, next: NextFunction) => {
    try {
        const { email, newPassword, otp } = req.body
        if (!email || !newPassword || !otp) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Please provide email, otp and new password",
                data: null
            })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "User not found",
                data: null
            })
        }
        if (user.otp !== otp) {
            return res.status(400).send({
                status: false,
                error: true,
                message: "Invalid OTP",
                data: null
            })
        }
        user.password = cryptr.encrypt(newPassword)
        user.otp = null
        user.save()
        return res.status(200).send({
            status: true,
            error: false,
            message: "Password reset successfully",
            data: null
        })
    }
    catch (err: any) {
        console.log(err)
        return res.status(500).send({
            status: false,
            error: true,
            message: err.message,
            data: null
        })
    }
}


export const updateProfile = async (
    req: Request<{}, {}, UpdateProfileRequestBody>, res: Response, next: NextFunction
) => {
    try {

    }
    catch (err: any) {
        console.log(err)
        return res.status(500).send({
            status: false,
            error: true,
            message: err.message,
            data: null
        })
    }
}
