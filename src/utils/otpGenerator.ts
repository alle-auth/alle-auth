const generateOtp = (): number => {
    // generate 4 digit random number
    const otp: number = Math.floor(1000 + Math.random() * 9000);
    return otp;
  };
  
  export default generateOtp;