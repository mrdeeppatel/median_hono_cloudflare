import { withAccelerate } from "@prisma/extension-accelerate";
import { PrismaClient } from "./generated/prisma/edge";
import { Hono } from "hono";
import z from "zod";
interface Bindings {
    JWTSECRET: string
    DATABASE_URL: string
}
interface Variables {
    email: string
    uuid: string
}

const blogStructure = z.object({
    title: z.string(),
    content: z.string(),
    published: z.boolean(),
    authorId: z.string()
})

const getPrismaClient = ({ c }: { c: { env: { DATABASE_URL: string } } }) => {
    return new PrismaClient({ accelerateUrl: c.env.DATABASE_URL }).$extends(withAccelerate())
}
const blog = new Hono<{ Bindings: Bindings, Variables: Variables }>()

blog.post('/blog', async (c) => {
    const body = await c.req.json()

    const result = blogStructure.safeParse({
        title: body.title,
        content: body.content,
        published: body.published,
        authorId: c.get("uuid")
    })
    console.log(result)

    if (!result.success) {
        return c.json({
            "MSG": "Error from zod validation"
        }, 409)
    }
    const prisma = getPrismaClient({ c })

    console.log("--------------------------------")
    console.log(c.get("uuid"))
    console.log(c.get("email"))
    console.log("--------------------------------")

    try {
        await prisma.posts.create({
            data: {
                title: body.title,
                content: body.content,
                published: body.published,
                authorId: c.get("uuid")
            }
        })

        return c.json({
            "msg": "blog created",
        })

    } catch (err) {
        return c.json({
            "msg": "Error in blog creation",
        }, 409)
    }
})

blog.put('/blog', async (c) => {

    const prisma = getPrismaClient({ c })
    const body = await c.req.json()

    try {
        await prisma.posts.update({
            where: {
                id: body.postId
            },
            data: {
                title: body.title,
                content: body.content
            }
        })
        return c.json({
            "msg": "Blog Updated"
        })
    } catch (err) {
        return c.json({
            "msg": "Error in Updating blog"
        }, 409)
    }
})

blog.get('/blog/:id', async (c) => {
    // console.log(await c.req.json())
    console.log("LOG -> " + c.req.param("id"))
    const body = await c.req.json()
    const prisma = getPrismaClient({ c })
    try {
        const result = await prisma.posts.findUnique({
            where: {
                id: c.req.param("id"),
                authorId: c.get("uuid")
            }
        })
        return c.json({
            "msg": "single post found",
            result
        })
    }
    catch (err) {
        return c.json({
            "msg": "error in finding single post",
        }, 409)
    }
})

blog.get('/bulk', async (c) => {
    // console.log(await c.req.json())
    const prisma = getPrismaClient({ c })

    try {

        const result = await prisma.posts.findMany({
            where: {
                authorId: c.get("uuid")
            }
        })
        return c.json({
            msg: "Users posts",
            result
        })
    } catch (err) {

        return c.json({
            msg: "Error while getting post"
        }, 409)
    }
})


export { blog } 
