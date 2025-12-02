# Bulkwala Backend

This is the backend for the Bulkwala e-commerce platform.

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the required environment variables
4. Start the server: `npm start`

## Deployment

This application is configured for deployment on Render. The [render.yaml](render.yaml) file contains the deployment configuration.

## Features

- User authentication and authorization
- Product management
- Order processing
- Payment integration
- Video support for products
- Cart and wishlist functionality
- Admin dashboard

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```