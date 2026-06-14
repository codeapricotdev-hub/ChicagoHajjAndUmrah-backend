const env = process.env.NODE_ENV; //DEV  STAGE  PROD

const DEV = {
    ENV:process.env.NODE_ENV,
    PORT:process.env.PORT,
    MONGO_URI:process.env.MONGO_URI,
    WEBSITE_URL:process.env.DEV_WEBSITE_URL,
    SENDGRID_API_KEY:process.env.SENDGRID_API_KEY,
    SENDGRID_NEW_INVITE:process.env.SENDGRID_NEW_INVITE,
    SENGRID_RESET_PASSWORD:process.env.SENGRID_RESET_PASSWORD,
    EMAIL:process.env.EMAIL ,
    JWT_SECRET:process.env.JWT_SECRET
}

const STAGE = {
    ENV:process.env.NODE_ENV,
    PORT:80,
    MONGO_URI:process.env.MONGO_URI,
    WEBSITE_URL:"",
    SENDGRID_API_KEY:process.env.SENDGRID_API_KEY,
    SENDGRID_NEW_INVITE:process.env.SENDGRID_NEW_INVITE,
    SENGRID_RESET_PASSWORD:process.env.SENGRID_RESET_PASSWORD,
    EMAIL:process.env.EMAIL ,
    JWT_SECRET:process.env.JWT_SECRET
}

const PROD = {
    ENV:process.env.NODE_ENV,
    PORT:80,
    MONGO_URI:process.env.MONGO_URI,
    WEBSITE_URL:"",
    SENDGRID_API_KEY:process.env.SENDGRID_API_KEY,
    SENDGRID_NEW_INVITE:process.env.SENDGRID_NEW_INVITE,
    SENGRID_RESET_PASSWORD:process.env.SENGRID_RESET_PASSWORD,
    EMAIL:process.env.EMAIL ,
    JWT_SECRET:process.env.JWT_SECRET
}

const config = {
    DEV,STAGE,PROD
}

module.exports = config[env];











