import { PrismaClient } from "./generated/prisma/edge"
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { sign } from "hono/jwt";

interface Bindings {
    DATABASE_URL: string,
    JWTSECRET: string
}
interface Variables {
    email: unknown | string;
}

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
    if (!body.email || !body.password) {
        // c.status(409)
        return c.json({
            msg: "email or password in payload not found"
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
        email: body.email
    }

    const jwt = await sign(payload, c.env.JWTSECRET, "HS256")

    console.log(user)
    return c.json({
        msg: "Login Successful",
        jwt
    })
})

export { user }