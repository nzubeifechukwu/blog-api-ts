import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { env } from "node:process";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding...");

  // Clean up existing data to prevent conflicts
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  const author = await prisma.user.create({
    data: {
      email: "nzube@blog.com",
      name: "Nzube Ifechukwu",
      password: hashedPassword,
      role: Role.AUTHOR,
    },
  });

  const reader = await prisma.user.create({
    data: {
      email: "afoma@blog.com",
      name: "Afoma Uwaoma",
      password: hashedPassword,
    },
  });

  console.log("Created sample users (Author & Reader)");

  const post1 = await prisma.post.create({
    data: {
      title: "Getting Started with Full-Stack Development",
      content:
        "Building modern web applications requires a strong understanding of both backend server architecture and client-side rendering. In this article, we explore how Node.js, Express, and React interact seamlessly via REST APIs.",
      published: true,
      authorId: author.id,
      comments: {
        create: [
          {
            content: "Great breakdown! Looking forward to the next article.",
            authorId: reader.id,
          },
          {
            content: "Very informative overview of full-stack architecture.",
            authorId: author.id,
          },
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      title: "Understanding Prisma ORM and PostgreSQL",
      content:
        "Prisma makes database management a breeze. With typesafe database queries, automated migrations, and intuitive relations, modeling data in PostgreSQL has never been easier.",
      published: true,
      authorId: author.id,
      comments: {
        create: [
          {
            content: "Prisma schema migrations save so much time!",
            authorId: reader.id,
          },
        ],
      },
    },
  });

  // Unpublished post: should appear only in author's draft
  await prisma.post.create({
    data: {
      title: "Draft: Advanced JWT Authentication Strategies",
      content:
        "This is an unpublished draft exploring token rotation, HTTP-only cookies, and session invalidation patterns...",
      authorId: author.id,
    },
  });

  console.log("Created 2 published posts and 1 draft post with comments.");
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
