import { Hono } from 'hono'
import { PrismaClient } from "./generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
// using hono jwt because there is a good change that jsonwebtoken does not work in the cloudflare environment
import { decode, sign, verify } from 'hono/jwt';


interface Bindings {
  DATABASE_URL: string,
  JWTSECRET: string
}
// Hono Generic for Bindings 
const app = new Hono<{ Bindings: Bindings }>().basePath("/api/v1")


function getPrismaClient({ c }: { c: { env: { DATABASE_URL: string } } }) {

  return new PrismaClient({
    accelerateUrl: c.env.DATABASE_URL
  }).$extends(withAccelerate())

}

app.post('/signup', async (c) => {

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
    c.status(409)
    return c.json({
      "MSG": "Error While creating user"
    })
  }

  const payload = {
    id: user.id,
    email: user.email,
    role: "user",
    exp: Math.floor(Date.now() / 1000) + 60 * 10,
  }

  const token = await sign(payload, c.env.JWTSECRET)
  
  return c.json({
    msg: "User Created",
    jwt: token
  })
})

app.post('/signin', (c) => {
  return c.text('Signin api!')
})

app.post('/blog', (c) => {
  return c.json({
    "msg": "uploading a blog"
  })
})

app.put('/blog', (c) => {
  return c.json({
    "msg": "Updating blog"
  })
})

app.get('/blog/:id', async (c) => {
  console.log(await c.req.json())
  console.log("LOG -> " + c.req.param("id"))
  return c.json({
    "msg": "234",
    "params_:id": c.req.param("id")
  })
})

export default app
