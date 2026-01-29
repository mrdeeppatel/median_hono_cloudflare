import { Hono } from 'hono'
import { PrismaClient } from "./generated/prisma/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
// using hono jwt because there is a good change that jsonwebtoken does not work in the cloudflare environment
import { decode, sign, verify } from 'hono/jwt';


interface Bindings {
  DATABASE_URL: string,
  JWTSECRET: string
}
interface Variables {
  email: unknown | string;
}

// Hono Generic for Bindings 
const app = new Hono<{ Bindings: Bindings, Variables: Variables }>().basePath("/api/v1")


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

app.post('/signin', async (c) => {

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


// Middleware
// for api/v1/**
app.use(async (c, next) => {

  const header = c.req.header()
  if (!header.jwt) {
    return c.json({
      msg: "Token not found"
    }, 409)
  }

  const jwt = header.jwt

  let result
  try {
    result = await verify(jwt, c.env.JWTSECRET, "HS256")
  } catch (e) {
    return c.json({
      msg: "JWT is not valid"
    }, 409)
  }

  c.set("email", result.email)
  await next()

})

app.post('/blog', (c) => {
  return c.json({
    "msg": "uploading a blog",
    "email": c.get("email")
  })
})

app.put('/blog', (c) => {
  return c.json({
    "msg": "Updating blog"
  })
})

app.get('/blog/:id', async (c) => {
  // console.log(await c.req.json())
  console.log("LOG -> " + c.req.param("id"))
  return c.json({
    "msg": "234",
    "params_:id": c.req.param("id")
  })
})

export default app
