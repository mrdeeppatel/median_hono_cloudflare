import { Hono } from 'hono'
// using hono jwt because there is a good change that jsonwebtoken does not work in the cloudflare environment
import { decode, sign, verify } from 'hono/jwt';
import { blog } from "./blogroute"
import { user } from './user';
`Apis
- signup
- signin
  middleware
- post blog
- put blog
- get blog one by id 
- get blog bulk 
`

interface Bindings {
  DATABASE_URL: string,
  JWTSECRET: string
}
interface Variables {
  email: unknown | string
  uuid: unknown | string
}

// Hono Generic for Bindings 
const app = new Hono<{ Bindings: Bindings, Variables: Variables }>().basePath("/api/v1")

app.route("/user", user)

app.get("/", (c) => {
  return c.json({ msg: "get request" })
})

// Middleware
// for api/v1/**
app.use(async (c, next) => {

  if (!c.req.header("jwt")) {
    return c.json({
      msg: "Token not found"
    }, 409)
  }

  let result
  try {
    result = await verify(c.req.header("jwt") || "", c.env.JWTSECRET, "HS256")
  } catch (e) {
    return c.json({
      msg: "JWT is not valid"
    }, 409)
  }

  c.set("email", result.email)
  c.set("uuid", result.uuid)
  await next()

})
app.route("/blog", blog)
export default app
