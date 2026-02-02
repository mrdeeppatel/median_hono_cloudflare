import { PrismaClient } from "./generated/prisma/edge"
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";
import z, { email } from "zod"
interface Bindings {
    DATABASE_URL: string,
    JWTSECRET: string
}
interface Variables {
    email: unknown | string;
}

const userStructure = z.object({
    email: z.email(),
    name: z.string().optional(),
    password: z.string().min(8).max(30)
})

//  export type UserTypes = z.infer<typeof userStructure>
// Hono Generic for Bindings 
const user = new Hono<{ Bindings: Bindings, Variables: Variables }>()


function getPrismaClient({ c }: { c: { env: { DATABASE_URL: string } } }) {

    return new PrismaClient({
        accelerateUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())

}

user.post('/signup', async (c) => {

    // console.log(c.env.DATABASE_URL)  
    const body = await c.req.json()
    const { success } = userStructure.safeParse({
        email: body.email,
        name: body.name,
        password: body.password
    })
    console.log(success)

    if (!success) {
        return c.json({
            "MSG": "Error from zod validation"
        }, 409)
    }
    const prisma = getPrismaClient({ c })

    let user = null
    try {
        user = await prisma.user.create({
            data: {
                email: body.email,
                password: body.password,
                name: body.name
            }
        })
    } catch (e) {
        // c.status(409)
        return c.json({
            "MSG": "Error While creating user"
        }, 409)
    }

    const payload = {
        id: user.id,
        email: user.email,
        uuid: user.id,
        role: "user",
        exp: Math.floor(Date.now() / 1000) + 60 * 10,
    }

    const jwt = await sign(payload, c.env.JWTSECRET, "HS256")

    return c.json({
        msg: "User Created",
        jwt
    })
})

user.post('/signin', async (c) => {

    const prisma = getPrismaClient({ c })
    const body = await c.req.json();

    // Checking payload for data
    const result = userStructure.safeParse({
        email: body.email,
        name: body.name,
        password: body.password
    })
    console.log(result)

    if (!result.success) {
        return c.json({
            "MSG": "Error from zod validation"
        }, 409)
    }
    // Checking for user credentials
    const user = await prisma.user.findUnique({
        where: {
            email: body.email,
            password: body.password
        }
    })

    if (!user) {
        // c.status(409)
        return c.json({
            msg: "User credentials are not valid"
        }, 409)
    }

    const payload = {
        id: user.id,
        email: user.email,
        uuid: user.id,
        role: "user",
        exp: Math.floor(Date.now() / 1000) + 60 * 10,
    }

    const jwt = await sign(payload, c.env.JWTSECRET, "HS256")

    console.log(user)
    return c.json({
        msg: "Login Successful",
        jwt
    })
})

export { user }