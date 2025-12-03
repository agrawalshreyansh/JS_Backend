# VideoTube Backend

A Node.js backend application for a video-sharing platform similar to YouTube, built with Express.js, MongoDB, and Cloudinary for media storage. It supports user authentication, video uploads, subscriptions, recommendations, and more.

## Features

- User registration and authentication (JWT-based)
- Video upload with thumbnail and metadata
- Video playback with view tracking and likes/dislikes
- User subscriptions and channel management
- Watch history
- Video recommendations and search
- Health check endpoint with keep-alive cron job

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer, Cloudinary
- **Other**: bcrypt for password hashing, node-cron for scheduled tasks

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd JS_Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URL=<your-mongodb-connection-string>
   CORS_ORIGIN=<your-frontend-origin>
   ACCESS_TOKEN_SECRET=<your-access-token-secret>
   REFRESH_TOKEN_SECRET=<your-refresh-token-secret>
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_EXPIRY=10d
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   MY_EMAIL=<your-email-for-sending-emails>
   MY_EMAIL_PASSWORD=<your-email-password>
   EMAIL_USER=<your-email-user>
   PORT=8000
   SERVER_URL=http://localhost:8000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will run on `http://localhost:8000` and start a keep-alive cron job to ping the health endpoint every 20 minutes.

## API Endpoints

### Health Check
- **GET** `/api/v1/health`
  - Description: Checks server health and uptime.
  - Response: JSON with status, timestamp, and uptime.

### User Routes (`/api/v1/users`)
- **POST** `/register`
  - Description: Register a new user.
  - Body: `fullName`, `email`, `username`, `password`, `avatar` (file), `coverImage` (file).
  - Requires: Avatar file.

- **POST** `/login`
  - Description: Login user.
  - Body: `username`, `password`.
  - Response: User data with access and refresh tokens.

- **POST** `/logout`
  - Description: Logout user (requires auth).
  - Requires: JWT token.

- **POST** `/refresh-token`
  - Description: Refresh access token.
  - Body: `refreshToken` (optional, from cookie).

- **GET** `/user/:username`
  - Description: Get user channel profile (optional auth).
  - Params: `username`.
  - Response: Channel details including subscribers count, etc.

- **PUT** `/changepassword`
  - Description: Change user password (requires auth).
  - Body: `username`, `oldPassword`, `newPassword`.

- **GET** `/authenticateStatus`
  - Description: Authenticate user status (requires auth).
  - Response: User data.

- **PUT** `/deletehistory`
  - Description: Delete a video from watch history (requires auth).
  - Body: `historyId`.

### Video Routes (`/api/v1/videos`)
- **POST** `/upload`
  - Description: Upload a video (requires auth).
  - Body: `title`, `description`, `playlist`, `category`, `videoFile` (file), `thumbnailFile` (file).

- **GET** `/play/:id`
  - Description: Play a video (optional auth).
  - Params: `id` (video ID).
  - Response: Video details with owner info, likes, etc.

- **GET** `/history`
  - Description: Get user's watch history (requires auth).
  - Response: List of watched videos.

- **GET** `/getVideos/:username`
  - Description: Get videos from a channel.
  - Params: `username`.

- **PATCH** `/:id/updateHistory`
  - Description: Update watch history and increment views (requires auth).
  - Params: `id` (video ID).

- **PATCH** `/:id/like`
  - Description: Like or unlike a video (requires auth).
  - Params: `id` (video ID).
  - Response: Like count.

- **PATCH** `/:id/dislike`
  - Description: Dislike or undislike a video (requires auth).
  - Params: `id` (video ID).

### Subscription Routes (`/api/v1/subscriptions`)
- **PUT** `/subscribeTo/:id`
  - Description: Subscribe or unsubscribe to a channel (requires auth).
  - Params: `id` (channel username).

- **GET** `/mysubscriptions`
  - Description: Get list of subscribed channels (requires auth).
  - Response: List of channels.

- **GET** `/subscribedvideos`
  - Description: Get videos from subscribed channels (requires auth).
  - Response: List of videos.

### Recommendation Routes (`/api/v1/recommend`)
- **GET** `/home`
  - Description: Get home videos with pagination.
  - Query: `page` (default 1), `limit` (default 8).
  - Response: Videos with pagination info.

- **GET** `/search`
  - Description: Search videos by title or description.
  - Query: `query`, `page` (default 1), `limit` (default 8).
  - Response: Videos with pagination and search query.

## Usage

- Use tools like Postman or curl to test the endpoints.
- Ensure MongoDB is running and connected.
- For file uploads, use multipart/form-data.
- JWT tokens are required for protected routes (passed via cookies or Authorization header).

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit changes.
4. Push and create a pull request.

## License

ISC
