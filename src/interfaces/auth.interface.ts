export interface SignUpRequestBody {
    email: string;
    password: string;
    name: string;
    role: string;
}

export interface SignInRequestBody {
    email: string;
    password: string;
}

export interface SignOutRequestBody {
    token: string;
}

export interface ForgotPasswordRequestBody {
    email: string;
}

export interface GetProfileRequestBody {
    token: string;
}

export interface VerifyOtpRequestBody {
    email: string;
    otp: string;
}

export interface ResetPasswordRequestBody {
    email: string;
    newPassword: string;
    otp: string;
}

export interface UpdateProfileRequestBody {
    // Define the expected fields for updating the user profile
}