# Blog API

A REST API designed to power a dual-frontend blogging platform: one frontend is for writing, editing and publishing posts, while the other is for reading and commenting on posts.

Built with Node.js, Express, PostgreSQL, and Prisma ORM, this API uses JWT authentication to ensure security.

**Live Deployment URL:** https://blog-api-lld2.onrender.com/

---

## Features

- **Dual-Role Authorization:** Dedicated workflows for `AUTHOR` and `READER` accounts.
- **Secure Authentication:** Stateless session management via JSON Web Tokens (JWT) and Passport.js.
- **Comprehensive Post CRUD:** Authors can create, read, update and delete articles.
- **Engagement System:** Users can write comments.
- **Content Moderation:** Deletion capabilities extended to both the comment creator and the parent post author.

---

## Tech Stack

- **Runtime Environment:** Node.js
- **Backend Framework:** Express.js
- **Database Driver & ORM:** Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** Passport.js (JWT Strategy) & bcryptjs (Password Hashing)
- **Input Validation:** express-validator

---

## API Reference & Endpoints

### Authentication & Profiles

| Method  | Endpoint      | Access    | Description                                         |
| ------- | ------------- | --------- | --------------------------------------------------- |
| `POST`  | `/users`      | Public    | Registers a new account (Defaults to `READER`).     |
| `POST`  | `/login`      | Public    | Authenticates credentials and returns a signed JWT. |
| `PATCH` | `/users/role` | Protected | Updates a user's role status.                       |

### Articles & Posts

| Method   | Endpoint     | Access      | Description                                                          |
| -------- | ------------ | ----------- | -------------------------------------------------------------------- |
| `GET`    | `/posts`     | Public      | Retrieves a listing of all published articles.                       |
| `GET`    | `/posts/:id` | Public      | Retrieves a specific article by its unique ID.                       |
| `POST`   | `/posts`     | Author Only | Creates a new article (defaults to draft format).                    |
| `PATCH`  | `/posts/:id` | Post Owner  | Updates parts of an article (title, content, or publication status). |
| `DELETE` | `/posts/:id` | Post Owner  | Removes an article and all of its associated comments.               |

### Comments System

| Method   | Endpoint              | Access        | Description                                                                |
| -------- | --------------------- | ------------- | -------------------------------------------------------------------------- |
| `POST`   | `/posts/:id/comments` | Authenticated | Appends a new comment to an article.                                       |
| `DELETE` | `/comments/:id`       | Authorized    | Deletes a comment (accessible by the comment creator and the post author). |

---

## Installation & Local Setup

### 1. Prerequisites

Ensure you have the following software installed on your machine:

- [Node.js](https://nodejs.org/) (v16.x or higher)
- [PostgreSQL](https://www.postgresql.org/) (Running locally or hosted via a cloud provider like Supabase)

### 2. Clone the Repository

```bash
git clone https://github.com/nzubeifechukwu/blog-api.git
cd blog-api

```

### 3. Install Dependencies

This project uses the `npm` package manager.

```bash
npm install

```

### 4. Configure Environment Variables

Create a `.env` file in the root directory of your project and configure the template below:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET="your_super_secret_jwt_key_here"

```

### 5. Run Database Migrations

Synchronize your local PostgreSQL database with the Prisma Schema blueprints:

```bash
npx prisma migrate dev --name init_blog_schema

```

### 6. Start the Server

To spin up the server with hot-reloading for development:

```bash
node --watch app.js

```

The server will boot up and listen for requests on `http://localhost:10000`.

---

## Testing the Endpoints

A pre-configured **Postman Collection** alongside separate **Local** and **Production Environment** JSON files are included in the root directory of this repository to help with testing the endpoints.

Follow these steps to run and test all 9 CRUD endpoints:

### 1. Import Config Files into Postman

1. Download `blog-api-postman-collection.json`, `blog-api-local.postman_environment.json` and `blog-api-production.postman_environment.json` from the root of this project.
2. Open Postman, click the **Import** button in the navigation pane, and select both files together.

### 2. Activate Your Target Environment

Depending on whether you want to test the API locally or live in production, select the appropriate environment dropdown in the top-right corner of Postman:

- **To Test Locally:** Select **Blog API - Local**. This routes `{{baseUrl}}` to `http://localhost:10000` (ensure your local server is running via `node --watch app.js`).
- **To Test Live Deployment:** Select **Blog API - Production**. This routes `{{baseUrl}}` directly to our live hosted web service on Render (`https://blog-api-lld2.onrender.com`), allowing you to test the live endpoints instantly without spinning up a local server or database.

### 3. Automated Route Authentication Tracking

1. Open the folder **Authentication & Users** and execute the **Register User** request followed by **Login User**.
2. From the JSON response payload generated by a successful login, copy your signed string `token`.
3. Select the **Environments** tab on Postman's far-left utility pane, open **Blog API - Local**, and paste the token string directly into the **Current Value** cell for the `jwt_token` key variable. Save the updates (`Ctrl + S`).
4. Every single protected endpoint contained inside this testing suite (e.g., Create Post, Update Post, Create Comment, etc.) inherits authorization parameters directly from the parent collection wrapper via the `{{jwt_token}}` mapping rule. You can test authorization restrictions immediately without manually altering request headers.

### 4. Alternative CLI Quick Testing (curl)

Alternatively, individual endpoints can be tested directly from the terminal or command line:

```bash
# Update an existing post status or title
curl -X PATCH http://localhost:10000/posts/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Article Title", "published": true}'

# Delete a comment
curl -X DELETE http://localhost:10000/comments/5 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

```

---

## Inspiration

This [Blog API project](https://www.theodinproject.com/lessons/node-path-nodejs-blog-api) is part of the The Odin Project's [Full-Stack Web Development (JavaScript) path](https://www.theodinproject.com/paths/full-stack-javascript).

---

## Contact

You can reach me on [X](https://x.com/NzubeIfechukwu) or [LinkedIn](https://www.linkedin.com/in/nzubeifechukwu/).
