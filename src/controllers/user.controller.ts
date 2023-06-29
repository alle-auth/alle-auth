const User = require('../models/user.model')
import { Request, Response, NextFunction } from "express"

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.find({})
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'User not found',
                data: null
            })
        }
        const users = await User.find()
        res.status(200).json({
            success: true,
            message: 'All users fetched successfully',
            data: users
        })
    }
    catch (err: any) {
        res.status(500).json({
            success: false,
            message: 'Error in fetching users',
            error: err.message
        })
    }
}

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await User.findById(req.params.id).populate('leads')
        res.status(200).json({
            success: true,
            message: 'User details fetched successfully',
            data: user
        })
    }
    catch (err: any) {
        res.status(500).json({
            success: false,
            message: 'Error in fetching user details',
            error: err.message
        })
    }
}